// POST /staff (owner only)
//   { action: "invite", email, role, name?, password? }
//        without a password: an invitation email from Auth
//        with one (10+ characters): the account is made ready at once, no email
//        (for a project that sends no email); the owner hands the password over
//   { action: "set_password", user, password } the owner sets a new password (no email needed)
//   { action: "revoke", user }                 removes access and blocks the account from signing in
//   { action: "delete_account", confirm: "DELETE" }  any member: deletes their own account for good
//        (the last active owner cannot, so the house always has one)
// Role changes are made directly in the admin (set_staff_role, owner-only in
// the database) and apply on the person's next request.
import { type Deps, HttpError, json, corsHeaders, readJson, requireStaff, fail } from "../_shared/http.ts";

const ROLES = ["owner", "editor", "support", "analyst"];

export async function handler(req: Request, deps: Deps): Promise<Response> {
  const cors = corsHeaders(req, deps);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  try {
    if (req.method !== "POST") throw new HttpError(405, "method");
    const b = await readJson(req, 4000);
    if (b.action === "delete_account") {
      const me = await requireStaff(req, deps, ["owner", "editor", "support", "analyst"]);
      if (b.confirm !== "DELETE") throw new HttpError(400, "confirm", "Type DELETE to confirm.");
      try { await deps.rpc("svc_leave_team", { p_user: me.user.id }); }
      catch (e) { if (/last owner/.test(String((e as any)?.message))) throw new HttpError(409, "last_owner", "You are the only owner. Make someone else owner first, then delete your account."); throw e; }
      await deps.authAdmin.remove(me.user.id);
      return json({ ok: true }, 200, cors);
    }
    const { user, jwt } = await requireStaff(req, deps, ["owner"]);
    if (b.action === "invite") {
      const email = String(b.email || "").trim().toLowerCase(), role = String(b.role || "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new HttpError(400, "email", "That email address does not look right.");
      if (!ROLES.includes(role)) throw new HttpError(400, "role");
      const password = b.password == null || b.password === "" ? null : String(b.password);
      if (password !== null && (password.length < 10 || password.length > 200)) throw new HttpError(400, "password", "Use at least 10 characters.");
      const redirect = deps.env("ADMIN_URL") || "";
      const invited = password ? await deps.authAdmin.create(email, password) : await deps.authAdmin.invite(email, redirect);
      await deps.rpc("svc_add_staff", { p_actor: user.id, p_user: invited.id, p_email: email, p_role: role, p_name: String(b.name || "").slice(0, 80) });
      return json({ ok: true, user: invited.id }, 200, cors);
    }
    if (b.action === "set_password") {
      const target = String(b.user || ""), password = String(b.password || "");
      if (password.length < 10 || password.length > 200) throw new HttpError(400, "password", "Use at least 10 characters.");
      const staff = await deps.rpc("svc_staff_role", { p_user: target, p_aal: "aal2" });
      if (!staff) throw new HttpError(404, "not_staff", "That person is not on the team.");
      await deps.authAdmin.setPassword(target, password);
      await deps.rpc("svc_audit", { p_actor: user.id, p_role: "owner", p_action: "staff.set_password", p_target: "staff:" + target, p_summary: {} });
      return json({ ok: true }, 200, cors);
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
