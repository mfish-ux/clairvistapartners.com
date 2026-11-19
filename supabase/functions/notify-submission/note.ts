// Turns one public.submissions row into a plain-text note.
// Columns match what capture.js stores and what admin.html reads.

const DEFAULT_TO = "mfish@clairvistapartners.com";
const RESEND_URL = "https://api.resend.com/emails";

const FIELDS: { key: string; label: string; max: number; block?: boolean }[] = [
  { key: "created_at", label: "When", max: 40 },
  { key: "kind", label: "Kind", max: 80 },
  { key: "name", label: "Name", max: 200 },
  { key: "email", label: "Email", max: 200 },
  { key: "company", label: "Company", max: 200 },
  { key: "page", label: "Page", max: 80 },
  { key: "body", label: "Message", max: 6000, block: true },
  { key: "subject", label: "Subject", max: 300 },
  { key: "from_tag", label: "Came from", max: 120 },
  { key: "referrer", label: "Referrer", max: 200 },
  { key: "utm_source", label: "Source", max: 120 },
  { key: "utm_campaign", label: "Campaign", max: 160 },
  { key: "utm_content", label: "Content", max: 120 },
  { key: "utm_term", label: "Term", max: 120 },
  { key: "city", label: "City", max: 120 },
  { key: "region", label: "Region", max: 120 },
  { key: "country", label: "Country", max: 8 },
  { key: "net_org", label: "Network", max: 160 },
  { key: "visit_id", label: "Visit", max: 80 },
  { key: "id", label: "Reference", max: 80 },
];

const KNOWN = new Set(FIELDS.map((f) => f.key));

export type Env = { get(name: string): string | undefined };
export type Send = (input: string, init: RequestInit) => Promise<Response>;

export type Note = {
  to: string[];
  subject: string;
  text: string;
  replyTo: string;
};

function clean(value: unknown, max: number): string {
  let s = "";
  if (typeof value === "string") s = value;
  else if (typeof value === "number" && Number.isFinite(value)) s = String(value);
  else if (typeof value === "boolean") s = value ? "yes" : "no";
  else return "";
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "");
  s = s.trim();
  if (s.length > max) s = s.slice(0, max).trim();
  return s;
}

function oneLine(value: unknown, max: number): string {
  return clean(value, max).replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim();
}

function block(value: unknown, max: number): string {
  return clean(value, max).replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function isEmail(value: string): boolean {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value) && value.length <= 200;
}

function labelFor(key: string): string {
  const words = key.replace(/[_-]+/g, " ").trim();
  if (!words) return "Field";
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function recipients(raw: string | undefined): string[] {
  const source = (raw ?? "").trim() || DEFAULT_TO;
  const out: string[] = [];
  for (const part of source.split(",")) {
    const email = part.trim();
    if (isEmail(email) && !out.includes(email)) out.push(email);
  }
  if (!out.length && isEmail(DEFAULT_TO)) out.push(DEFAULT_TO);
  return out;
}

export function replyAddress(value: unknown): string {
  const email = oneLine(value, 200);
  if (!isEmail(email)) return "";
  if (/@clairvistapartners\.com$/i.test(email)) return "";
  return email;
}

export function buildNote(row: Record<string, unknown> | null | undefined, toRaw: string | undefined): Note {
  const source = row && typeof row === "object" ? row : {};
  const kind = oneLine(source.kind, 80);
  const lines: string[] = ["A new note came in from the site.", ""];
  let any = false;
  const push = (label: string, value: string, asBlock: boolean) => {
    if (!value) return;
    any = true;
    if (asBlock) lines.push(label + ":", value, "");
    else lines.push(label + ": " + value);
  };
  for (const field of FIELDS) {
    const value = field.block ? block(source[field.key], field.max) : oneLine(source[field.key], field.max);
    push(field.label, value, !!field.block);
  }
  const extras = Object.keys(source).filter((key) => !KNOWN.has(key)).sort();
  for (const key of extras) {
    push(labelFor(key), oneLine(source[key], 300), false);
  }
  if (!any) lines.push("The row had no details filled in.");
  return {
    to: recipients(toRaw),
    subject: "New site note: " + (kind || "Message"),
    text: lines.join("\n").trim() + "\n",
    replyTo: replyAddress(source.email),
  };
}

export async function secretOk(given: string, expected: string): Promise<boolean> {
  if (!given || !expected) return false;
  const enc = new TextEncoder();
  const [da, db] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(given)),
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
  ]);
  const a = new Uint8Array(da);
  const b = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function submissionRow(body: unknown):
  | { ok: true; row: Record<string, unknown> }
  | { ok: false; skip: boolean; status: number; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, skip: false, status: 400, error: "Expected a JSON object." };
  }
  const payload = body as Record<string, unknown>;
  const type = typeof payload.type === "string" ? payload.type.toUpperCase() : "";
  const table = typeof payload.table === "string" ? payload.table : "";
  const schema = typeof payload.schema === "string" ? payload.schema : "";
  if (type && type !== "INSERT") return { ok: false, skip: true, status: 200, error: "Ignored." };
  if (table && table !== "submissions") return { ok: false, skip: true, status: 200, error: "Ignored." };
  if (schema && schema !== "public") return { ok: false, skip: true, status: 200, error: "Ignored." };
  if (payload.record == null) return { ok: true, row: {} };
  if (typeof payload.record !== "object" || Array.isArray(payload.record)) {
    return { ok: false, skip: false, status: 400, error: "The record was not an object." };
  }
  return { ok: true, row: payload.record as Record<string, unknown> };
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function handleNotify(req: Request, env: Env, send: Send = fetch): Promise<Response> {
  try {
    if (req.method !== "POST") return json(405, { error: "POST only." });
    const expected = (env.get("WEBHOOK_SECRET") ?? "").trim();
    const given = (req.headers.get("x-webhook-secret") ?? "").trim();
    if (!(await secretOk(given, expected))) return json(401, { error: "Unauthorized." });

    const len = Number(req.headers.get("content-length") || "0");
    if (Number.isFinite(len) && len > 200000) return json(413, { error: "Payload too large." });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: "Expected JSON." });
    }

    const parsed = submissionRow(body);
    if (!parsed.ok) {
      return parsed.skip ? json(200, { ok: true, skipped: true }) : json(parsed.status, { error: parsed.error });
    }

    const from = (env.get("NOTIFY_FROM") ?? "").trim();
    const key = (env.get("RESEND_API_KEY") ?? "").trim();
    const note = buildNote(parsed.row, env.get("NOTIFY_TO"));
    if (!from || !key || !note.to.length) return json(500, { error: "Mail is not configured." });

    const payload: Record<string, unknown> = {
      from,
      to: note.to,
      subject: note.subject,
      text: note.text,
    };
    if (note.replyTo) payload.reply_to = note.replyTo;

    let res: Response;
    try {
      res = await send(RESEND_URL, {
        method: "POST",
        redirect: "error",
        headers: {
          authorization: "Bearer " + key,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch {
      return json(502, { error: "The mail service did not accept the note." });
    }
    if (!res.ok) return json(502, { error: "The mail service did not accept the note." });
    return json(200, { ok: true });
  } catch {
    return json(500, { error: "The note could not be sent." });
  }
}
