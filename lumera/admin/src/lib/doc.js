// Editing one content document: load, change, save the draft (with a version
// check so two tabs or two people never overwrite each other silently),
// autosave while working, keep a local copy of unsaved work, publish.
import { useEffect, useRef, useState } from "preact/hooks";
import { sb, rpc, fn, q, isConflict, message } from "./sb.js";
import { setLeaveGuard } from "./router.js";
import { t } from "./i18n.js";
import { toast } from "./ui.jsx";

const LOCAL = (k) => "silavu-unsaved:" + k;
const clone = (o) => JSON.parse(JSON.stringify(o));

export async function getDoc(key) {
  return await q(sb.from("content_docs").select("*").eq("key", key).maybeSingle());
}
export async function listDocs(kind, withData = false) {
  return await q(sb.from("content_docs").select(withData ? "*" : "key,kind,title,sort,draft_rev,published_rev,draft_updated_at,published_at,archived_at,published_archived").eq("kind", kind).order("sort").order("key"));
}

export function useDoc(key, kind, { title, blank } = {}) {
  const [s, set] = useState({ loading: true, error: null, doc: null, data: null, dirty: false, saving: false, savedAt: null, conflict: false, restoredLocal: false });
  const st = useRef(s); st.current = s;
  const load = async (keepLocal = true) => {
    set(x => ({ ...x, loading: true, error: null }));
    try {
      const doc = await getDoc(key);
      let data = doc ? clone(doc.draft) : (blank ? clone(blank) : null), dirty = false, restoredLocal = false;
      const local = keepLocal ? (() => { try { return JSON.parse(localStorage.getItem(LOCAL(key)) || "null"); } catch (e) { return null; } })() : null;
      /* unsaved work from before a closed tab, kept only if it was based on this version */
      if (local && (!doc || local.rev === doc.draft_rev)) { data = local.data; dirty = true; restoredLocal = true; }
      set({ loading: false, error: null, doc, data, dirty, saving: false, savedAt: doc ? doc.draft_updated_at : null, conflict: false, restoredLocal });
    } catch (e) { set(x => ({ ...x, loading: false, error: e })); }
  };
  useEffect(() => { load(); }, [key]);

  const setData = (v) => set(x => {
    const data = typeof v === "function" ? v(x.data) : v;
    try { localStorage.setItem(LOCAL(key), JSON.stringify({ rev: x.doc ? x.doc.draft_rev : 0, data })); } catch (e) {}
    return { ...x, data, dirty: true };
  });

  async function save({ checkpoint = true, quiet = false } = {}) {
    const x = st.current; if (x.saving || x.conflict) return false;
    set(y => ({ ...y, saving: true }));
    try {
      const r = await rpc("save_draft", { p_key: key, p_kind: kind, p_title: (typeof title === "function" ? title(x.data) : title) || x.doc?.title || key, p_data: x.data, p_expected_rev: x.doc ? x.doc.draft_rev : 0, p_checkpoint: checkpoint });
      const doc = await getDoc(key);
      try { localStorage.removeItem(LOCAL(key)); } catch (e) {}
      /* if they kept typing while it saved, what is on screen is still newer */
      set(y => ({ ...y, doc, saving: false, dirty: y.data !== x.data, savedAt: r.saved_at, restoredLocal: false }));
      if (!quiet) toast(t("Draft saved. Not live until you publish."));
      return true;
    } catch (e) {
      if (isConflict(e)) { set(y => ({ ...y, saving: false, conflict: true })); toast(t("Someone else saved this page meanwhile. Your version is kept; reload to see theirs."), "bad"); }
      else { set(y => ({ ...y, saving: false })); toast(message(e), "bad"); }
      return false;
    }
  }

  async function publish(note) {
    if (st.current.dirty && !(await save({ quiet: true }))) return null;
    try {
      const r = await fn("publish", { action: "publish", keys: [key], note: note || "" });
      set(y => ({ ...y })); const doc = await getDoc(key); set(y => ({ ...y, doc }));
      toast(r.dispatched ? t("Published. The site is rebuilding; it is usually live in two to four minutes.") : t("Published in the database, but the site build did not start: {e}. Retry from History.", { e: r.error || "" }), r.dispatched ? "ok" : "bad");
      return r;
    } catch (e) { toast(message(e), "bad"); return null; }
  }

  /* autosave: quietly, every 30 seconds of unsaved work, without making a history entry */
  useEffect(() => { const i = setInterval(() => { const x = st.current; if (x.dirty && !x.saving && !x.conflict && x.data) save({ checkpoint: false, quiet: true }); }, 30000); return () => clearInterval(i); }, [key]);
  useEffect(() => { setLeaveGuard((silent) => { const x = st.current; if (!x.dirty) return true; return silent ? false : confirm(t("You have unsaved changes. Leave without saving? (A copy is kept on this device.)")); }); return () => setLeaveGuard(null); }, [key]);

  /* keep their version after a conflict: reload, then put mine back as unsaved */
  async function keepMine() {
    const mine = st.current.data; await load(false); setData(mine); set(y => ({ ...y, conflict: false }));
  }
  return { ...s, setData, save, publish, reload: () => load(false), keepMine };
}

/* publish everything that is waiting */
export async function pendingCount() {
  const rows = await q(sb.from("content_docs").select("key,draft_rev,published_rev,archived_at,published_archived"));
  return rows.filter(r => r.draft_rev !== r.published_rev || !!r.archived_at !== !!r.published_archived);
}
