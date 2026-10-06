// POST /collect: the site's anonymous counter. The tracker only sends once the
// visitor has allowed it (or in the cookieless mode the owner can choose);
// this end drops anything not on the allowlist, deduplicates retries, and
// sets robots aside. It answers 204 with nothing, whatever happens, so a
// page never waits on it.
import { type Deps, corsHeaders, originAllowed, sha256hex, clientIp } from "../_shared/http.ts";
import { readAgent, country } from "../_shared/ua.ts";

export async function handler(req: Request, deps: Deps): Promise<Response> {
  const cors = corsHeaders(req, deps);
  const done = (status = 204) => new Response(null, { status, headers: cors });
  if (req.method === "OPTIONS") return done();
  if (req.method !== "POST" || !originAllowed(req, deps)) return done(403);
  try {
    const raw = new Uint8Array(await req.arrayBuffer());
    if (raw.byteLength > 32000) return done(413);
    const body = JSON.parse(new TextDecoder().decode(raw));
    const events = Array.isArray(body && body.events) ? body.events.slice(0, 50) : [];
    if (!events.length) return done();
    const who = await sha256hex((deps.env("RATE_SALT") || "silavu") + "|c|" + clientIp(req));
    if (!(await deps.rpc("svc_rate_hit", { p_bucket: "col:" + who, p_limit: 240, p_window: 60 }))) return done(429);
    const a = readAgent(req.headers.get("user-agent") || "");
    await deps.rpc("svc_ingest_events", { p_events: events, p_ctx: { device: a.device, browser: a.browser, os: a.os, bot: a.bot, country: country(req.headers) } });
    return done();
  } catch (e) {
    console.error("collect:", String((e as any)?.message || e));
    return done();
  }
}
