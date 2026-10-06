// History and backups: every release and whether it went live, every saved
// version of a page with a comparison and a way back, the audit trail, and
// the owner's export.
import { useState } from "preact/hooks";
import { sb, rpc, fn, q, message } from "../lib/sb.js";
import { t } from "../lib/i18n.js";
import { when } from "../lib/time.js";
import { go } from "../lib/router.js";
import { Button, Pill, PageHead, Load, useLoad, Tabs, Modal, toast, ask, Empty } from "../lib/ui.jsx";
import { ReleaseState, KIND } from "./Publish.jsx";

export function History({ role, tab = "releases" }) {
  const tabs = [["releases", t("Releases")], ["versions", t("Versions")], ...(role === "owner" ? [["audit", t("Audit trail")], ["backups", t("Backups")]] : [])];
  return <>
    <PageHead title={t("History & backups")} />
    <Tabs tabs={tabs} value={tab} onChange={(k) => go("history/" + k)} />
    {tab === "releases" && <Releases role={role} />}
    {tab === "versions" && <AllVersions />}
    {tab === "audit" && role === "owner" && <Audit />}
    {tab === "backups" && role === "owner" && <Backups />}
  </>;
}

function Releases({ role }) {
  const s = useLoad(() => q(sb.from("releases").select("id,created_at,created_by,status,note,build_url,error,restored_from,finished_at,doc_revs").order("id", { ascending: false }).limit(50)));
  const again = async (id) => { if (!(await ask(t("Make release {n} current again?", { n: id }), t("Every page goes back to how it was in that release, as a new release. Nothing is deleted; the versions in between stay in the history."), t("Restore this release"), true))) return;
    try { const r = await fn("publish", { action: "republish", release: id }); toast(r.dispatched ? t("Restored. The site is rebuilding.") : r.watched ? t("Published. GitHub checks for new releases every few minutes; the site is usually live within 10 to 15 minutes.") : t("Restored in the database; the build did not start: {e}", { e: r.error })); s.reload(); } catch (e) { toast(message(e), "bad"); } };
  const retry = async (id) => { try { const r = await fn("publish", { action: "retry", release: id }); toast(r.dispatched ? t("The build was started again.") : r.watched ? t("Waiting for GitHub's next check; it starts on its own within about ten minutes.") : r.error, r.dispatched || r.watched ? "ok" : "bad"); s.reload(); } catch (e) { toast(message(e), "bad"); } };
  return <Load s={s}>{(rows) => rows.length ? <table class="tbl"><thead><tr><th>#</th><th>{t("When")}</th><th>{t("What")}</th><th>{t("State")}</th><th></th></tr></thead><tbody>
    {rows.map(r => <tr><td>{r.id}</td><td>{when(r.created_at)}</td><td>{r.note || (r.restored_from ? t("Restored release {n}", { n: r.restored_from }) : t("{n} changes", { n: Object.keys(r.doc_revs || {}).length }))}</td><td><ReleaseState r={r} /></td>
      <td>{(r.status === "queued" || r.status === "failed") && <Button kind="quiet" onClick={() => retry(r.id)}>{t("Start the build again")}</Button>}{role === "owner" && r.status !== "queued" && <Button kind="quiet" onClick={() => again(r.id)}>{t("Restore")}</Button>}</td></tr>)}
  </tbody></table> : <Empty title={t("No releases yet.")} />}</Load>;
}

/* the versions of one document, with what changed and a way back */
export function Revisions({ docKey, onRestored, compact }) {
  const [open, setOpen] = useState(!compact);
  const s = useLoad(async () => open ? q(sb.from("content_revisions").select("id,rev,source,created_at,actor,note,data").eq("doc_key", docKey).order("id", { ascending: false }).limit(40)) : [], [docKey, open]);
  const [cmp, setCmp] = useState(null);
  if (!open) return <div class="card"><button type="button" class="acc" onClick={() => setOpen(true)}><span>{t("Earlier versions")}</span><span>›</span></button></div>;
  const restore = async (r) => { if (!(await ask(t("Go back to this version?"), t("It becomes the draft (a new version; nothing is lost). Publish to put it on the site."), t("Use this version")))) return;
    try { await rpc("restore_revision", { p_revision: r.id }); toast(t("Restored as the draft.")); onRestored && onRestored(); s.reload(); } catch (e) { toast(message(e), "bad"); } };
  return <section class="card"><h2>{t("Earlier versions")}</h2>
    <Load s={s}>{(rows) => rows.length ? <table class="tbl"><tbody>{rows.map((r, i) => <tr><td>{when(r.created_at)}</td><td><Pill tone={r.source === "publish" ? "ok" : ""}>{t({ import: "imported", draft: "saved", publish: "published", restore: "restored", archive: "archived" }[r.source])}</Pill></td><td class="hint">{r.note}</td>
      <td>{rows[i + 1] && <Button kind="quiet" onClick={() => setCmp([rows[i + 1], r])}>{t("What changed")}</Button>}<Button kind="quiet" onClick={() => restore(r)}>{t("Use this version")}</Button></td></tr>)}</tbody></table> : <p class="hint">{t("No versions yet.")}</p>}</Load>
    {cmp && <Modal title={t("What changed")} wide onClose={() => setCmp(null)}><Diff a={cmp[0].data} b={cmp[1].data} /></Modal>}
  </section>;
}

/* a readable comparison: each changed field, before and after */
function flat(o, p = "", out = {}) { if (o && typeof o === "object") { for (const [k, v] of Object.entries(o)) flat(v, p ? p + "." + k : k, out); } else out[p] = o; return out; }
export function Diff({ a, b }) {
  const A = flat(a), B = flat(b), keys = [...new Set([...Object.keys(A), ...Object.keys(B)])].filter(k => JSON.stringify(A[k]) !== JSON.stringify(B[k]));
  if (!keys.length) return <p>{t("No differences.")}</p>;
  return <table class="tbl diff"><thead><tr><th>{t("Field")}</th><th>{t("Before")}</th><th>{t("After")}</th></tr></thead><tbody>{keys.map(k => <tr><td><code>{k}</code></td><td class="del">{String(A[k] ?? "")}</td><td class="add">{String(B[k] ?? "")}</td></tr>)}</tbody></table>;
}

function AllVersions() {
  const s = useLoad(() => q(sb.from("content_revisions").select("id,doc_key,source,created_at,note").order("id", { ascending: false }).limit(100)));
  return <Load s={s}>{(rows) => <table class="tbl"><tbody>{rows.map(r => <tr><td>{when(r.created_at)}</td><td>{r.doc_key}</td><td><Pill>{t({ import: "imported", draft: "saved", publish: "published", restore: "restored", archive: "archived" }[r.source])}</Pill></td><td class="hint">{r.note}</td></tr>)}</tbody></table>}</Load>;
}

function Audit() {
  const [page, setPage] = useState(0);
  const s = useLoad(async () => ({ rows: await q(sb.from("audit_log").select("*").order("id", { ascending: false }).range(page * 100, page * 100 + 99)), staff: await q(sb.from("staff").select("user_id,display_name,email")) }), [page]);
  return <Load s={s}>{({ rows, staff }) => <>
    <p class="hint">{t("Every sensitive action: who, what, when. It cannot be edited or deleted, by anyone.")}</p>
    <table class="tbl"><thead><tr><th>{t("When")}</th><th>{t("Who")}</th><th>{t("Action")}</th><th>{t("On")}</th><th>{t("Details")}</th></tr></thead><tbody>
      {rows.map(r => <tr><td>{when(r.at)}</td><td>{r.actor ? ((staff.find(s => s.user_id === r.actor) || {}).display_name || (staff.find(s => s.user_id === r.actor) || {}).email || r.actor.slice(0, 8)) : r.actor_role}</td><td>{r.action}</td><td>{r.target}</td><td class="hint">{JSON.stringify(r.summary)}</td></tr>)}
    </tbody></table>
    <div class="pager"><Button disabled={!page} onClick={() => setPage(page - 1)}>← {t("Newer")}</Button><Button disabled={rows.length < 100} onClick={() => setPage(page + 1)}>{t("Older")} →</Button></div>
  </>}</Load>;
}

function Backups() {
  const [busy, setBusy] = useState(false), [last, setLast] = useState(null);
  const s = useLoad(async () => { const { data, error } = await sb.storage.from("exports").list("", { limit: 50, sortBy: { column: "created_at", order: "desc" } }); if (error) throw error; return data; });
  const make = async () => { setBusy(true); try { const r = await fn("export", {}); setLast(r); toast(t("Export ready.")); s.reload(); } catch (e) { toast(message(e), "bad"); } setBusy(false); };
  const dl = async (name) => { const { data, error } = await sb.storage.from("exports").createSignedUrl(name, 600); if (error) return toast(message(error), "bad"); location.href = data.signedUrl; };
  return <section class="card">
    <h2>{t("Exports")}</h2>
    <p class="hint">{t("A full copy of the content, its history, releases, the library's records, enquiries, customers, quotes, the team and the audit trail, as one compressed file. Kept privately; links work for ten minutes. Pictures stay in the library and are copied separately when restoring (see ADMIN_SETUP.md).")}</p>
    <Button kind="primary" busy={busy} onClick={make}>{t("Make an export now")}</Button>
    {last && <p><a href={last.url}>{t("Download {n}", { n: last.name })}</a></p>}
    <Load s={s}>{(files) => files.length ? <ul class="plain">{files.filter(f => f.name).map(f => <li><button type="button" class="linkb" onClick={() => dl(f.name)}>{f.name}</button></li>)}</ul> : <p class="hint">{t("No exports yet.")}</p>}</Load>
  </section>;
}
