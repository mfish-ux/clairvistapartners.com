import { buildNote, handleNotify, replyAddress, secretOk, submissionRow } from "./note.ts";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function eq(actual: unknown, expected: unknown, msg: string) {
  if (actual !== expected) throw new Error(msg + "\n  actual: " + JSON.stringify(actual) + "\n  expected: " + JSON.stringify(expected));
}

function env(map: Record<string, string>) {
  return { get: (name: string) => map[name] };
}

function post(body: unknown, secret = "s3cret"): Request {
  return new Request("https://example.test/notify-submission", {
    method: "POST",
    headers: { "content-type": "application/json", "x-webhook-secret": secret },
    body: JSON.stringify(body),
  });
}

Deno.test("missing fields still make a calm note", () => {
  const note = buildNote({}, undefined);
  eq(note.subject, "New site note: Message", "subject");
  eq(note.replyTo, "", "reply");
  eq(note.to[0], "mfish@clairvistapartners.com", "default recipient");
  assert(note.text.includes("The row had no details filled in."), "empty copy");
  assert(!note.text.includes("undefined"), "no undefined");
  assert(!note.text.includes("null"), "no null");
});

Deno.test("kind, visitor reply-to, trim, and odd values", () => {
  const note = buildNote({
    kind: "  Early list:\r\nI have stuff  ",
    name: " Ada ",
    email: " ada@example.com ",
    company: null,
    page: "companies",
    body: " Hello \u0000there ",
    city: "Boston",
    extra_flag: true,
    nested: { no: "thanks" },
  }, "  other@example.com  ");
  eq(note.subject, "New site note: Early list: I have stuff", "subject keeps one line");
  eq(note.replyTo, "ada@example.com", "reply-to");
  eq(note.to.join(","), "other@example.com", "override recipient");
  assert(note.text.includes("Name: Ada"), "name");
  assert(note.text.includes("Message:\nHello there"), "body trimmed");
  assert(note.text.includes("City: Boston"), "city");
  assert(note.text.includes("Extra flag: yes"), "extra scalar");
  assert(!note.text.includes("thanks"), "object dropped");
  assert(!note.text.includes("Company:"), "null company skipped");
});

Deno.test("site addresses are not used as reply-to", () => {
  eq(replyAddress("prism@clairvistapartners.com"), "", "site address");
  eq(replyAddress("not an email"), "", "phone or words");
  eq(replyAddress("a@b.co"), "a@b.co", "visitor");
});

Deno.test("secret compare rejects blanks and mismatches", async () => {
  assert(await secretOk("s3cret", "s3cret"), "match");
  assert(!(await secretOk("s3cret", "other")), "mismatch");
  assert(!(await secretOk("", "s3cret")), "blank given");
  assert(!(await secretOk("s3cret", "")), "blank expected");
});

Deno.test("only an insert on public.submissions is mailed", () => {
  const insert = submissionRow({ type: "INSERT", table: "submissions", schema: "public", record: { kind: "A quick chat" }, old_record: null });
  assert(insert.ok && insert.row.kind === "A quick chat", "insert");
  const update = submissionRow({ type: "UPDATE", table: "submissions", schema: "public", record: { kind: "x" } });
  assert(!update.ok && update.skip, "update skipped");
  const other = submissionRow({ type: "INSERT", table: "events", schema: "public", record: {} });
  assert(!other.ok && other.skip, "other table");
  const bad = submissionRow({ type: "INSERT", table: "submissions", record: "nope" });
  assert(!bad.ok && !bad.skip && bad.status === 400, "bad record");
  const empty = submissionRow({ type: "INSERT", table: "submissions", schema: "public", record: null });
  assert(empty.ok && Object.keys(empty.row).length === 0, "null record");
});

Deno.test("handler sends one plain-text email and ignores a bad secret", async () => {
  const sent: { url: string; body: Record<string, unknown>; auth: string }[] = [];
  const send: typeof fetch = (input, init) => {
    sent.push({
      url: String(input),
      body: JSON.parse(String(init?.body || "{}")),
      auth: String((init?.headers as Record<string, string>)?.authorization || ""),
    });
    return Promise.resolve(new Response(JSON.stringify({ id: "email_1" }), { status: 200 }));
  };
  const vars = {
    WEBHOOK_SECRET: "s3cret",
    RESEND_API_KEY: "re_test",
    NOTIFY_FROM: "Clairvista Partners <notes@example.com>",
  };
  const denied = await handleNotify(post({ type: "INSERT", table: "submissions", schema: "public", record: { kind: "A quick chat" } }, "nope"), env(vars), send);
  eq(denied.status, 401, "denied");
  eq(sent.length, 0, "no mail on a bad secret");

  const ok = await handleNotify(post({
    type: "INSERT",
    table: "submissions",
    schema: "public",
    record: { kind: "A quick chat", name: "Ada", email: "ada@example.com", body: "One line.", page: "index" },
    old_record: null,
  }), env(vars), send);
  eq(ok.status, 200, "sent");
  eq(sent.length, 1, "one call");
  eq(sent[0].url, "https://api.resend.com/emails", "resend");
  eq(sent[0].auth, "Bearer re_test", "key stays on the request");
  eq(sent[0].body.subject, "New site note: A quick chat", "subject");
  eq(sent[0].body.reply_to, "ada@example.com", "reply-to");
  assert(String(sent[0].body.text).includes("Name: Ada"), "plain words");
  assert(!("html" in sent[0].body), "plain text only");

  const skipped = await handleNotify(post({ type: "DELETE", table: "submissions", schema: "public", record: null, old_record: { kind: "x" } }), env(vars), send);
  eq(skipped.status, 200, "delete does not retry");
  eq(sent.length, 1, "delete sends no mail");

  const down = await handleNotify(post({ type: "INSERT", table: "submissions", record: { kind: "Checklist" } }), env(vars), () => Promise.resolve(new Response("no", { status: 422 })));
  eq(down.status, 502, "resend failure");

  const bare = await handleNotify(post({ type: "INSERT", table: "submissions", record: {} }), env({ WEBHOOK_SECRET: "s3cret", RESEND_API_KEY: "re_test", NOTIFY_FROM: "" }), send);
  eq(bare.status, 500, "missing sender");
});
