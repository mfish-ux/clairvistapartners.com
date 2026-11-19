// Database webhook: INSERT on public.submissions sends one plain-text email.
// Deploy with JWT checks off. The shared WEBHOOK_SECRET header is the lock.
import { handleNotify } from "./note.ts";

Deno.serve((req) => handleNotify(req, Deno.env));
