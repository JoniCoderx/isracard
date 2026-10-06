// Publishing: what is waiting, publishing it, and following the build until
// the site has it. Saving a draft and going live are different things, and
// this is the only place where drafts go live (besides each editor's own
// "Publish this page").
import { useEffect, useState } from "preact/hooks";
import { sb, fn, q, message } from "../lib/sb.js";
import { t } from "../lib/i18n.js";
import { ago, when } from "../lib/time.js";
import { Button, Modal, Pill, Input, toast, Empty } from "../lib/ui.jsx";
import { pendingCount } from "../lib/doc.js";

export function usePending(role) {
  const [list, set] = useState([]);
  const reload = async () => { if (role !== "owner" && role !== "editor") return; try { set(await pendingCount()); } catch (e) {} };
  useEffect(() => { reload(); const i = setInterval(reload, 60000); return () => clearInterval(i); }, [role]);
  return { list, reload };
}

export const KIND = { product: "Product", collections: "Collection", page: "Home chapters", strings: "Page text", translations: "Other languages", policy: "Policy", about: "About", docpage: "Page", navigation: "Menus", configurator: "The Line", seo: "Search and sharing", settings: "Settings" };

/* follows one release until the site has it */
export function useRelease(id) {
  const [r, set] = useState(null);
  useEffect(() => {
    if (!id) return; let stop = false, n = 0;
    const tick = async () => { try { const row = await q(sb.from("releases").select("id,status,build_url,error,created_at,finished_at,note").eq("id", id).maybeSingle()); if (!stop) set(row); if (row && (row.status === "live" || row.status === "failed" || row.status === "superseded")) return; } catch (e) {}
      if (!stop && ++n < 120) setTimeout(tick, 5000); };
    tick(); return () => { stop = true; };
  }, [id]);
  return r;
}
export function ReleaseState({ r }) {
  if (!r) return null;
  const tone = { queued: "info", building: "info", live: "ok", failed: "bad", superseded: "" }[r.status];
  const words = { queued: t("Waiting for the build to start"), building: t("Building the site…"), live: t("Live on the site"), failed: t("The build failed: the site still shows the previous version"), superseded: t("Replaced by a newer release") }[r.status];
  return <div class="relstate"><Pill tone={tone}>{words}</Pill>{r.build_url && <a href={r.build_url} target="_blank" rel="noopener">{t("Build log")} ↗</a>}{r.error && <div class="hint">{r.error}</div>}</div>;
}

export function PublishPanel({ role, pending, onClose }) {
  const [rows, setRows] = useState(null), [pick, setPick] = useState({}), [note, setNote] = useState(""), [busy, setBusy] = useState(false), [rel, setRel] = useState(null), [res, setRes] = useState(null), [empty, setEmpty] = useState(false);
  const release = useRelease(rel);
  useEffect(() => { (async () => {
    const all = await q(sb.from("content_docs").select("key,kind,title,draft_updated_at,draft_rev,published_rev,archived_at,published_archived").order("kind").order("sort"));
    setEmpty(!all.length);
    const p = all.filter(r => r.draft_rev !== r.published_rev || !!r.archived_at !== !!r.published_archived);
    setRows(p); setPick(Object.fromEntries(p.map(r => [r.key, true])));
  })().catch(e => toast(message(e), "bad")); }, []);
  const go = async () => {
    setBusy(true);
    try {
      const keys = rows.filter(r => pick[r.key]).map(r => r.key);
      const r = await fn("publish", { action: "publish", keys: keys.length === rows.length ? null : keys, note });
      setRes(r); setRel(r.release); pending.reload();
    } catch (e) { toast(message(e), "bad"); }
    setBusy(false);
  };
  const importSite = async () => { setBusy(true); try { const r = await fn("setup", { action: "import" }); toast(t("Imported {n} documents from the live site.", { n: r.imported })); onClose(); location.reload(); } catch (e) { toast(message(e), "bad"); } setBusy(false); };
  return <Modal title={t("Publish")} onClose={onClose} wide actions={rel ? <Button onClick={onClose}>{t("Close")}</Button> : <><Button onClick={onClose}>{t("Cancel")}</Button>{rows && rows.length > 0 && <Button kind="primary" busy={busy} disabled={!Object.values(pick).some(Boolean)} onClick={go}>{t("Publish the selected changes")}</Button>}</>}>
    {empty && role === "owner" ? <div class="setup"><h3>{t("First time here")}</h3><p>{t("The database is empty. Bring in the site exactly as it is now; from then on the admin is where it changes.")}</p><Button kind="primary" busy={busy} onClick={importSite}>{t("Import the current site")}</Button></div>
    : rel ? <div>
        <p>{t("Release {n} is recorded.", { n: rel })} {res && !res.dispatched && !res.watched && <strong class="badtx">{t("The build did not start: {e}", { e: res.error || "" })}</strong>}</p>
        <ReleaseState r={release} />
        {res && !res.dispatched && !res.watched && <Button onClick={async () => { const r = await fn("publish", { action: "retry", release: rel }); setRes(r); }}>{t("Try starting the build again")}</Button>}
        <p class="hint">{res && res.watched ? t("GitHub checks for new releases every few minutes, so the build starts on its own within about ten minutes.") + " " : ""}{t("Saving and publishing are done. The site rebuilds itself from what you published; it is usually live within two to four minutes. If the build fails, the site keeps showing the previous version and nothing you published is lost.")}</p>
      </div>
    : !rows ? <p>{t("Loading…")}</p>
    : !rows.length ? <Empty title={t("Everything is live.")}>{t("There are no unpublished changes.")}</Empty>
    : <>
      <p>{t("These have changes that are saved but not live yet:")}</p>
      <ul class="checklist">{rows.map(r => <li><label><input type="checkbox" checked={!!pick[r.key]} onChange={(e) => setPick({ ...pick, [r.key]: e.target.checked })} />
        <span><strong>{r.title || r.key}</strong> <small>{t(KIND[r.kind] || r.kind)} · {r.archived_at && !r.published_archived ? t("to be taken down") : !r.archived_at && r.published_archived ? t("to be brought back") : r.published_rev ? t("changed {when}", { when: ago(r.draft_updated_at) }) : t("new")}</small></span></label></li>)}</ul>
      <Input label={t("A note for the history (optional)")} value={note} onInput={setNote} />
    </>}
  </Modal>;
}
