// Telling the house an enquiry arrived, and (when the reader left an email
// address and the house has switched it on) sending the reader a short
// confirmation. Notification is separate from saving: an enquiry is saved
// first, and a failed email is recorded against it without undoing anything.
//
// Providers, in order of preference:
//   resend      RESEND_API_KEY and MAIL_FROM set (a verified sender domain)
//   formsubmit  NOTIFY_FORMSUBMIT=on and NOTIFY_TO set (the free relay the
//               site already used; the inbox must have been activated)
//   off         neither: the enquiry is in the admin, nobody is emailed
import type { Deps } from "./http.ts";

export type Enquiry = { id: string; ref: string; name: string; email?: string | null; phone?: string | null; contact?: string; city?: string; channel?: string;
  want?: string; product?: string; selection?: string; message?: string; lang?: string };

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

export function provider(deps: Deps): "resend" | "formsubmit" | "off" {
  if (deps.env("RESEND_API_KEY") && deps.env("MAIL_FROM") && deps.env("NOTIFY_TO")) return "resend";
  if (deps.env("NOTIFY_FORMSUBMIT") === "on" && deps.env("NOTIFY_TO")) return "formsubmit";
  return "off";
}

function houseText(e: Enquiry, adminUrl: string): { subject: string; text: string; html: string } {
  const rows: [string, string][] = [["Reference", e.ref], ["Name", e.name], ["Email", e.email || ""], ["Phone", e.phone || ""], ["City", e.city || ""],
    ["Answer by", e.channel || ""], ["About", e.want || ""], ["Piece", e.product || ""], ["Their selection", e.selection || ""], ["Language", e.lang || ""]];
  const text = rows.filter(r => r[1]).map(r => `${r[0]}: ${r[1]}`).join("\n") + `\n\n${e.message || ""}\n\nOpen it in the admin: ${adminUrl}#/enquiries/${e.id}`;
  const html = `<table style="font:14px/1.5 -apple-system,Segoe UI,sans-serif;border-collapse:collapse">${rows.filter(r => r[1]).map(r => `<tr><td style="padding:4px 16px 4px 0;color:#777">${esc(r[0])}</td><td style="padding:4px 0">${esc(r[1])}</td></tr>`).join("")}</table>`
    + `<p style="font:14px/1.6 -apple-system,Segoe UI,sans-serif;white-space:pre-wrap">${esc(e.message)}</p><p><a href="${esc(adminUrl)}#/enquiries/${esc(e.id)}">Open it in the admin</a></p>`;
  return { subject: `SILAVU · ${e.name} · ${e.ref}`, text, html };
}

function readerText(e: Enquiry): { subject: string; text: string } {
  return e.lang === "he"
    ? { subject: "SILAVU · קיבלנו את פנייתכם", text: `שלום ${e.name},\n\nתודה שפניתם ל־SILAVU. הפנייה שלכם (${e.ref}) הגיעה לקונסיירז׳, ונחזור אליכם באופן אישי.\n\nSILAVU` }
    : { subject: "SILAVU · We have your enquiry", text: `Dear ${e.name},\n\nThank you for writing to SILAVU. Your enquiry (${e.ref}) has reached the concierge, and we will answer you personally.\n\nSILAVU` };
}

/* returns the status to record: sent, failed (with why) or off */
export async function notify(deps: Deps, e: Enquiry, autoReply: boolean): Promise<{ status: "sent" | "failed" | "off"; error?: string }> {
  const p = provider(deps), to = deps.env("NOTIFY_TO") || "", admin = deps.env("ADMIN_URL") || "";
  try {
    if (p === "resend") {
      const send = async (body: Record<string, unknown>) => {
        const r = await deps.fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: "Bearer " + deps.env("RESEND_API_KEY"), "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
        if (!r.ok) throw new Error("mail provider answered " + r.status);
      };
      const h = houseText(e, admin);
      await send({ from: deps.env("MAIL_FROM"), to: [to], subject: h.subject, text: h.text, html: h.html, ...(e.email ? { reply_to: e.email } : {}) });
      if (autoReply && e.email) { const r = readerText(e); await send({ from: deps.env("MAIL_FROM"), to: [e.email], subject: r.subject, text: r.text, reply_to: to }); }
      return { status: "sent" };
    }
    if (p === "formsubmit") {
      const h = houseText(e, admin), r = readerText(e);
      const body: Record<string, unknown> = { _subject: h.subject, _template: "table", _captcha: "false", Reference: e.ref, Name: e.name, Email: e.email || "", Phone: e.phone || "",
        City: e.city || "", "Answer by": e.channel || "", About: e.want || "", Piece: e.product || "", Selection: e.selection || "", Message: e.message || "", Admin: `${admin}#/enquiries/${e.id}` };
      if (e.email) body.email = e.email;
      if (autoReply && e.email) body._autoresponse = r.text;
      const res = await deps.fetch("https://formsubmit.co/ajax/" + encodeURIComponent(to), { method: "POST", headers: { "content-type": "application/json", accept: "application/json", origin: deps.env("SITE_URL") || "", referer: deps.env("SITE_URL") || "" }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || String((j as any).success) === "false") throw new Error("relay refused: " + ((j as any).message || res.status));
      return { status: "sent" };
    }
    return { status: "off" };
  } catch (err) {
    return { status: "failed", error: String((err as any)?.message || err).slice(0, 300) };
  }
}
