// POST /enquiry: the site's form. Saves the enquiry, then tells the house.
// Answers success only once the database has the record, with its reference;
// a second press of Send (the same idempotency key) returns the same record.
import { type Deps, HttpError, json, corsHeaders, originAllowed, readJson, sha256hex, clientIp, fail } from "../_shared/http.ts";
import { notify } from "../_shared/notify.ts";
import { powOk, offensive } from "../_shared/guard.ts";

export async function handler(req: Request, deps: Deps): Promise<Response> {
  const cors = corsHeaders(req, deps);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  try {
    if (req.method !== "POST") throw new HttpError(405, "method");
    if (!originAllowed(req, deps)) throw new HttpError(403, "origin");
    const body = await readJson(req, 24000);
    // the same visitor may send a few, not a flood; the address is hashed, never kept
    const who = await sha256hex((deps.env("RATE_SALT") || "silavu") + "|" + clientIp(req));
    const okShort = await deps.rpc("svc_rate_hit", { p_bucket: "enq10m:" + who, p_limit: 5, p_window: 600 });
    const okDay = await deps.rpc("svc_rate_hit", { p_bucket: "enqday:" + who, p_limit: 20, p_window: 86400 });
    if (!okShort || !okDay) throw new HttpError(429, "rate_limited", "Too many enquiries from here just now. Please try again later or write to us directly.");

    // a bot that does not run the page cannot send (see _shared/guard.ts)
    if (!(await powOk(body.idem, body.pow))) throw new HttpError(400, "invalid", "Please reload the page and send again.", { fields: ["pow"] });
    let saved: any;
    try { saved = await deps.rpc("svc_submit_enquiry", { p: body }); }
    catch (e) {
      const m = String((e as any)?.message || e);
      const inv = m.match(/invalid: ([\w.,]+)/);
      if (inv) throw new HttpError(400, "invalid", "Some details need another look.", { fields: inv[1].split(",") });
      if (/invalid request/.test(m)) throw new HttpError(400, "invalid", "The enquiry could not be read.");
      throw e;
    }
    let confirmation = false;
    if (!saved.duplicate) {
      const bad = offensive(body.name, body.message, body.city);
      if (bad) await deps.rpc("svc_flag_enquiry", { p_id: saved.id, p_reason: "words: " + bad });
      const email = body.email || (String(body.contact || "").includes("@") ? body.contact : null);
      const reply = deps.env("AUTO_REPLY") === "on" && body.reply !== false && !!email;
      const n = await notify(deps, { id: saved.id, ref: saved.ref, name: String(body.name || ""), email,
        phone: body.phone || null, city: body.city, channel: body.channel, want: body.want, product: body.ref || body.product, selection: body.selection, message: body.message, lang: body.lang }, reply);
      await deps.rpc("svc_set_enquiry_notify", { p_id: saved.id, p_status: n.status, p_error: n.error || null });
      // the page promises a confirmation email only if one was actually sent
      confirmation = reply && n.status === "sent";
    }
    return json({ ok: true, id: saved.id, ref: saved.ref, received_at: saved.created_at, duplicate: !!saved.duplicate, confirmation }, 200, cors);
  } catch (e) { return fail(e, cors); }
}
