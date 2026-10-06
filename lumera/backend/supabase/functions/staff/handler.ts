// POST /staff (owner only)
//   { action: "invite", email, role, name? }   sends an invitation from Auth, adds them as staff
//   { action: "revoke", user }                 removes access and blocks the account from signing in
// Role changes are made directly in the admin (set_staff_role, owner-only in
// the database) and apply on the person's next request.
import { type Deps, HttpError, json, corsHeaders, readJson, requireStaff, fail } from "../_shared/http.ts";

const ROLES = ["owner", "editor", "support", "analyst"];

export async function handler(req: Request, deps: Deps): Promise<Response> {
  const cors = corsHeaders(req, deps);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  try {
    if (req.method !== "POST") throw new HttpError(405, "method");
    const { user, jwt } = await requireStaff(req, deps, ["owner"]);
    const b = await readJson(req, 4000);
    if (b.action === "invite") {
      const email = String(b.email || "").trim().toLowerCase(), role = String(b.role || "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new HttpError(400, "email", "That email address does not look right.");
      if (!ROLES.includes(role)) throw new HttpError(400, "role");
      const redirect = deps.env("ADMIN_URL") || "";
      const invited = await deps.authAdmin.invite(email, redirect);
      await deps.rpc("svc_add_staff", { p_actor: user.id, p_user: invited.id, p_email: email, p_role: role, p_name: String(b.name || "").slice(0, 80) });
      return json({ ok: true, user: invited.id }, 200, cors);
    }
    if (b.action === "revoke") {
      const target = String(b.user || "");
      await deps.userRpc(jwt, "revoke_staff", { p_user: target });
      try { await deps.authAdmin.ban(target); } catch (e) { console.error("ban:", String((e as any)?.message || e)); }
      return json({ ok: true }, 200, cors);
    }
    throw new HttpError(400, "action");
  } catch (e) { return fail(e, cors, true); }
}
