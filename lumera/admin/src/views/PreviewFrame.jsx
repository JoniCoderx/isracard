// The preview: the real page in a frame, in either language, at desktop or
// phone width. Only inside the signed-in admin; nothing here is public.
import { useEffect, useState } from "preact/hooks";
import { t } from "../lib/i18n.js";
import { message } from "../lib/sb.js";
import { Modal, Button, Tabs } from "../lib/ui.jsx";
import { previewHome, previewDocument } from "../lib/preview.js";

export function Preview({ onClose, build, title }) {
  const [lang, setLang] = useState("en"), [w, setW] = useState("desk"), [doc, setDoc] = useState(null), [err, setErr] = useState(null), [notes, setNotes] = useState([]);
  useEffect(() => {
    let stop = false; setDoc(null); setErr(null);
    (async () => {
      const spec = build(lang);
      if (spec.kind === "doc") { const h = await previewDocument(spec.docKind, spec.data, lang); if (!stop) setDoc(h); }
      else { const r = await previewHome({ ...spec, lang }); if (!stop) { setDoc(r.html); setNotes(r.notes || []); } }
    })().catch(e => !stop && setErr(e));
    return () => { stop = true; };
  }, [lang]);
  return <Modal title={title || t("Preview")} onClose={onClose} wide actions={<Button onClick={onClose}>{t("Close")}</Button>}>
    <div class="pvbar">
      <Tabs tabs={[["en", "English"], ["he", "עברית"]]} value={lang} onChange={setLang} />
      <Tabs tabs={[["desk", t("Desktop")], ["phone", t("Phone")]]} value={w} onChange={setW} />
      <span class="hint">{t("This is your draft on the real page. Visitors still see the published version.")}</span>
    </div>
    {notes.length > 0 && <div class="notice">{t("Chapters hidden on the live site cannot be shown in the preview until they are published:")} {notes.join(", ")}</div>}
    {err ? <div class="state bad">{message(err)}</div> : !doc ? <div class="state"><span class="spin" />{t("Building the preview…")}</div>
      : <div class={"pvwrap " + w}><iframe title={t("Preview")} class="pv" srcdoc={doc} sandbox="allow-scripts allow-same-origin" referrerpolicy="no-referrer" /></div>}
  </Modal>;
}
