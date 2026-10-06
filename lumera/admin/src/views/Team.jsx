// The team (owner only): invite, change a role, require a second factor,
// remove. Every change applies to the person's very next request.
import { useState } from "preact/hooks";
import { sb, rpc, fn, q, message } from "../lib/sb.js";
import { t } from "../lib/i18n.js";
import { day } from "../lib/time.js";
import { Button, Input, Select, Pill, PageHead, Load, useLoad, Modal, toast, ask } from "../lib/ui.jsx";

const ROLES = [["owner", "Owner", "Everything, including the team, security, exports and restoring."], ["editor", "Editor", "Products, pages, media and publishing. No customers, no team."],
  ["support", "Support", "Enquiries, customers and quotes. No publishing, no team, no bulk export."], ["analyst", "Analyst", "Visit figures only. No names, no editing."]];

export function Team({ me }) {
  const s = useLoad(() => q(sb.from("staff").select("*").order("created_at")));
  const [inv, setInv] = useState(false);
  const change = async (u, role) => { if (!(await ask(t("Change this person's role?"), t("It applies to their next request, and they are signed out everywhere."), t("Change")))) return s.reload(); try { await rpc("set_staff_role", { p_user: u.user_id, p_role: role }); toast(t("Role changed.")); s.reload(); } catch (e) { toast(message(e), "bad"); } };
  const revoke = async (u) => { if (!(await ask(t("Remove {n}?", { n: u.display_name || u.email }), t("Their access ends at once, they are signed out everywhere, and the account can no longer sign in."), t("Remove"), true))) return; try { await fn("staff", { action: "revoke", user: u.user_id }); toast(t("Removed.")); s.reload(); } catch (e) { toast(message(e), "bad"); } };
  const mfa = async (u, on) => { try { await rpc("set_staff_mfa", { p_user: u.user_id, p_required: on }); toast(on ? t("They now need an authenticator code to sign in.") : t("Saved.")); s.reload(); } catch (e) { toast(message(e), "bad"); } };
  return <>
    <PageHead title={t("Team")} sub={t("People are only ever added by invitation. Nobody can give themselves a role.")}><Button kind="primary" onClick={() => setInv(true)}>+ {t("Invite someone")}</Button></PageHead>
    <section class="card"><dl class="roles">{ROLES.map(r => <><dt>{t(r[1])}</dt><dd>{t(r[2])}</dd></>)}</dl></section>
    <Load s={s}>{(rows) => <table class="tbl"><thead><tr><th>{t("Person")}</th><th>{t("Role")}</th><th>{t("Authenticator required")}</th><th>{t("Since")}</th><th></th></tr></thead><tbody>
      {rows.map(u => <tr class={u.active ? "" : "off"}><td>{u.display_name || "–"}<div class="hint">{u.email}</div></td>
        <td>{u.active && u.user_id !== me.user_id ? <select aria-label={t("Role")} value={u.role} onChange={(e) => change(u, e.target.value)}>{ROLES.map(r => <option value={r[0]}>{t(r[1])}</option>)}</select> : <Pill>{u.active ? t(u.role) : t("removed")}</Pill>}</td>
        <td>{u.active && <label class="chk"><input type="checkbox" checked={u.mfa_required} onChange={(e) => mfa(u, e.target.checked)} /> {u.mfa_required ? t("Yes") : t("No")}</label>}</td>
        <td>{day(u.created_at)}</td><td>{u.active && u.user_id !== me.user_id && <Button kind="quiet" onClick={() => revoke(u)}>{t("Remove")}</Button>}</td></tr>)}
    </tbody></table>}</Load>
    {inv && <Invite onClose={() => { setInv(false); s.reload(); }} />}
  </>;
}

function Invite({ onClose }) {
  const [email, setEmail] = useState(""), [name, setName] = useState(""), [role, setRole] = useState("editor"), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const send = async () => { setErr(""); setBusy(true); try { await fn("staff", { action: "invite", email, role, name }); toast(t("Invitation sent to {e}.", { e: email })); onClose(); } catch (e) { setErr(message(e)); } setBusy(false); };
  return <Modal title={t("Invite someone")} onClose={onClose} actions={<><Button onClick={onClose}>{t("Cancel")}</Button><Button kind="primary" busy={busy} onClick={send}>{t("Send the invitation")}</Button></>}>
    <Input label={t("Email")} type="email" value={email} onInput={setEmail} error={err} />
    <Input label={t("Name")} value={name} onInput={setName} />
    <Select label={t("Role")} value={role} onChange={setRole} options={ROLES.map(r => ({ value: r[0], label: t(r[1]) + " · " + t(r[2]) }))} />
    <p class="hint">{t("They receive an email with a link to choose a password. The link works once.")}</p>
  </Modal>;
}
