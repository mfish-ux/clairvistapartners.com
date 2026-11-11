# Email on each submission

An insert into `public.submissions` can send one plain-text email through Resend. The site keeps saving the row the way it does now. This function only runs after that insert.

Nothing in this folder is a secret. Set the keys in the Supabase dashboard or with `supabase secrets set`. Do not commit them, and do not put them in `supabase/functions/.env` on a machine whose files get published.

## Secrets

Create a Resend account, verify the domain or the single sender you will use, and create an API key.

Then set these on the linked project:

```bash
supabase secrets set \
  RESEND_API_KEY='re_your_key' \
  NOTIFY_FROM='Clairvista Partners <notes@clairvistapartners.com>' \
  NOTIFY_TO='mfish@clairvistapartners.com' \
  WEBHOOK_SECRET='a-long-random-string'
```

| Name | Role |
| --- | --- |
| `RESEND_API_KEY` | Resend API key. Required. |
| `NOTIFY_FROM` | Sender Resend has verified. Use `Name <email@domain>` or a bare address. Required. |
| `NOTIFY_TO` | Who receives the note. Optional. If unset, mail goes to `mfish@clairvistapartners.com`. Several addresses can be separated by commas. |
| `WEBHOOK_SECRET` | Shared string. The database webhook sends it in the `x-webhook-secret` header. Required. If it is empty, every request is refused. |

`NOTIFY_FROM` has to be a sender Resend accepts. A new domain needs Resend's DNS records before the first real note.

For a local `supabase functions serve`, put the same names in `supabase/functions/.env`. That file is gitignored.

## Deploy

From the repo root, logged in and linked to project `oilvzabkaoiliabefwrh`:

```bash
supabase link --project-ref oilvzabkaoiliabefwrh
supabase functions deploy notify-submission --no-verify-jwt
```

`--no-verify-jwt` is required. A database webhook is not a signed-in user, so it has no JWT. The header secret is the check. The same switch is saved in `supabase/config.toml` as `verify_jwt = false`, so a later deploy keeps it.

The function URL is:

```text
https://oilvzabkaoiliabefwrh.supabase.co/functions/v1/notify-submission
```

## Webhook in the dashboard

1. Deploy the function first, and set the secrets.
2. In the Supabase dashboard open Database, then Webhooks, then Create a new hook.
3. Name it `notify-submission`.
4. Table: `public.submissions`. Event: Insert only.
5. Webhook type: HTTP Request. Method: POST.
6. URL: `https://oilvzabkaoiliabefwrh.supabase.co/functions/v1/notify-submission`
7. HTTP headers:
   - `Content-Type`: `application/json`
   - `x-webhook-secret`: the same string as `WEBHOOK_SECRET`
8. Save.

Leave the project API key off this hook. The function does not read it.

## Webhook in SQL

`pg_net` is already available on a hosted project. Run this once in the SQL editor. It stores the project URL and the webhook secret in Vault, so the secret is not pasted into a trigger that shows up in a dump. Replace both vault values before running. Use the same secret you set as `WEBHOOK_SECRET`.

The function lives in schema `private`, which the Data API does not expose.

```sql
create schema if not exists private;

select vault.create_secret('https://oilvzabkaoiliabefwrh.supabase.co', 'project_url');
select vault.create_secret('a-long-random-string', 'submission_webhook_secret');

create or replace function private.notify_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
      || '/functions/v1/notify-submission',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'submission_webhook_secret')
    ),
    body := jsonb_build_object(
      'type', tg_op,
      'table', tg_table_name,
      'schema', tg_table_schema,
      'record', to_jsonb(new),
      'old_record', null
    ),
    timeout_milliseconds := 5000
  );
  return new;
end;
$$;

revoke all on function private.notify_submission() from public;
grant execute on function private.notify_submission() to anon, authenticated, service_role;

drop trigger if exists notify_submission on public.submissions;
create trigger notify_submission
after insert on public.submissions
for each row execute function private.notify_submission();
```

Inserts from the site run as `anon`, which cannot read Vault. `security definer` lets the trigger read the secret anyway. Do not move this function into `public`.

To change the secret later, update the vault secret and `WEBHOOK_SECRET` together.

## What the email says

The subject is `New site note: <kind>`. If kind is missing, the subject is `New site note: Message`.

The body is plain text. It lists the row in plain words: when, kind, name, email, company, page, message, subject, came from, referrer, source, campaign, city, region, country, network, visit, and reference. Empty fields are left out. Extra scalar columns are added at the end. A missing or empty row still sends a short note and does not throw.

If the row has a visitor email, that address is the reply-to. A phone number, a blank, or an address at clairvistapartners.com does not set reply-to.

## Test

Check the types from the repo root:

```bash
deno check supabase/functions/notify-submission/index.ts
deno test supabase/functions/notify-submission/note_test.ts
```

After the secrets and the deploy, this calls the live function once and sends one email. It does not insert a database row. Swap in the real webhook secret:

```bash
curl -sS -D - -X POST \
  'https://oilvzabkaoiliabefwrh.supabase.co/functions/v1/notify-submission' \
  -H 'Content-Type: application/json' \
  -H 'x-webhook-secret: YOUR_WEBHOOK_SECRET' \
  -d '{"type":"INSERT","table":"submissions","schema":"public","record":{"kind":"A quick chat","name":"Test","email":"visitor@example.com","body":"Hello","page":"index"},"old_record":null}'
```

A matching secret returns `{"ok":true}` and one email arrives. A wrong or missing secret returns 401 and sends nothing.

## Booking link and phone

Those are not part of this function. They live in `contact.js` at the site root.

- `BOOKING_URL` is blank. The Book 20 minutes control stays off the chat card and the footer until that value is a full `https://` address.
- `PHONE` is `+18577634111`. `PHONE_SHOWN` is `(857) 763-4111`. The Call us tab dials that number.
