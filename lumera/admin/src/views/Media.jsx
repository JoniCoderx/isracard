// The library: every picture and film the site can use. Originals are kept
// as uploaded; the site makes its own sizes when it publishes. A file that is
// used somewhere, or that an older version still needs, is never deleted.
import { useEffect, useState } from "preact/hooks";
import { sb, rpc, q, message } from "../lib/sb.js";
import { t } from "../lib/i18n.js";
import { when } from "../lib/time.js";
import { href, go } from "../lib/router.js";
import { upload, signedFor, TYPES } from "../lib/media.js";
import { Button, Input, TextArea, Bi, Pill, PageHead, Load, useLoad, Modal, toast, ask, Empty } from "../lib/ui.jsx";
import { Preview } from "./PreviewFrame.jsx";

const mb = (n) => (n / 1048576).toFixed(n > 10485760 ? 0 : 1) + " MB";

function useLibrary({ search, tag, kind }) {
  return useLoad(async () => {
    let b = sb.from("media_assets").select("*").is("deleted_at", null).order("created_at", { ascending: false }).limit(300);
    if (kind) b = b.eq("kind", kind);
    if (tag) b = b.contains("tags", [tag]);
    if (search) b = b.or(`title.ilike.*${search.replace(/[,()*]/g, " ")}*,filename.ilike.*${search.replace(/[,()*]/g, " ")}*,folder.ilike.*${search.replace(/[,()*]/g, " ")}*`);
    const rows = await q(b);
    const urls = await signedFor(rows.filter(r => r.status === "ready"));
    return rows.map(r => ({ ...r, url: urls[r.id] || "" }));
  }, [search, tag, kind]);
}

function Uploader({ onDone, folder }) {
  const [log, setLog] = useState([]), [busy, setBusy] = useState(false), [over, setOver] = useState(false);
  const run = async (files) => {
    setBusy(true); const out = [];
    for (const f of files) {
      setLog(l => [...l, { name: f.name, step: t("Waiting…") }]);
      const set = (step, tone) => setLog(l => l.map(x => x.name === f.name ? { ...x, step, tone } : x));
      try { const r = await upload(f, { folder, onStep: (s) => set(s) }); set(r.ok ? (r.small ? t("Added, but under 1254 pixels across: it may look soft on large screens.") : t("Added.")) : r.reason, r.ok ? (r.small ? "warn" : "ok") : "bad"); if (r.ok) out.push(r.id); }
      catch (e) { set(message(e), "bad"); }
    }
    setBusy(false); onDone && onDone(out);
  };
  return <div class={"drop" + (over ? " over" : "")} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); run([...e.dataTransfer.files]); }}>
    <p>{t("Drop pictures or films here, or")} <label class="b"><input type="file" multiple accept={Object.keys(TYPES).join(",")} hidden onChange={(e) => { const f = [...e.target.files]; e.target.value = ""; run(f); }} disabled={busy} />{t("choose files")}</label></p>
    <p class="hint">{t("JPEG, PNG, WebP or AVIF pictures, MP4 or WebM films, up to 50 MB each. For product photographs, 1254 pixels or more on the short side.")}</p>
    {log.length > 0 && <ul class="uplog">{log.map(x => <li class={x.tone || ""}><b>{x.name}</b> {x.step}</li>)}</ul>}
  </div>;
}

export function MediaPicker({ kind = "image", multiple, onPick, onClose }) {
  const [search, setSearch] = useState(""), [sel, setSel] = useState([]);
  const s = useLibrary({ search, kind });
  return <Modal title={kind === "video" ? t("Choose a film") : t("Choose photographs")} wide onClose={onClose} actions={<><Button onClick={onClose}>{t("Cancel")}</Button><Button kind="primary" disabled={!sel.length} onClick={() => onPick(sel)}>{t("Use {n}", { n: sel.length })}</Button></>}>
    <Uploader onDone={(ids) => { s.reload(); setSel(x => multiple ? [...x, ...ids] : ids.slice(0, 1)); }} />
    <Input label={t("Search the library")} value={search} onInput={setSearch} />
    <Load s={s} empty={(d) => !d.length}>{(rows) => <div class="mgrid">{rows.map(r => <button type="button" class={"mitem" + (sel.includes(r.id) ? " on" : "") + (r.status !== "ready" ? " off" : "")} disabled={r.status !== "ready"} aria-pressed={sel.includes(r.id)}
      onClick={() => setSel(x => x.includes(r.id) ? x.filter(y => y !== r.id) : multiple ? [...x, r.id] : [r.id])}>
      {r.kind === "video" ? <video src={r.url} muted preload="metadata" /> : <img src={r.url} alt={r.alt?.en || r.title} loading="lazy" />}
      <span>{r.title || r.filename}</span>{r.status !== "ready" && <Pill tone="bad">{t(r.status)}</Pill>}</button>)}</div>}</Load>
  </Modal>;
}

export function Media({ id }) {
  const [search, setSearch] = useState(""), [tag, setTag] = useState(""), [kind, setKind] = useState("");
  const s = useLibrary({ search, tag, kind });
  if (id) return <MediaDetail id={id} onChange={s.reload} />;
  return <>
    <PageHead title={t("Media library")} sub={t("Pictures and films for products, pages and bands. A file in use cannot be deleted.")} />
    <Uploader onDone={() => s.reload()} />
    <div class="filters"><Input label={t("Search")} value={search} onInput={setSearch} /><Input label={t("Tag")} value={tag} onInput={setTag} />
      <label class="fld"><span>{t("Kind")}</span><select value={kind} onChange={(e) => setKind(e.target.value)}><option value="">{t("All")}</option><option value="image">{t("Pictures")}</option><option value="video">{t("Films")}</option></select></label></div>
    <Load s={s} empty={(d) => !d.length}>{(rows) => <div class="mgrid">{rows.map(r => <a class={"mitem" + (r.status !== "ready" ? " off" : "")} href={href("media/" + r.id)}>
      {r.status !== "ready" ? <div class="thumb ph" /> : r.kind === "video" ? <video src={r.url} muted preload="metadata" /> : <img src={r.url} alt={r.alt?.en || r.title} loading="lazy" />}
      <span>{r.title || r.filename}</span><small>{r.width && r.height ? `${r.width}×${r.height} · ` : ""}{mb(r.bytes)}</small>
      {r.status !== "ready" && <Pill tone="bad">{t(r.status)}</Pill>}{r.width && r.kind === "image" && Math.min(r.width, r.height) < 1254 && <Pill tone="warn">{t("small")}</Pill>}</a>)}</div>}</Load>
  </>;
}

function MediaDetail({ id, onChange }) {
  const s = useLoad(async () => { const r = await q(sb.from("media_assets").select("*").eq("id", id).maybeSingle()); if (!r) return null; const u = await signedFor([r]); return { ...r, url: u[r.id], usage: await rpc("media_usage", { p_id: id }) }; }, [id]);
  const [busy, setBusy] = useState(false), [replace, setReplace] = useState(false);
  return <Load s={s} empty={(d) => !d}>{(r) => {
    const set = (k, v) => s.set({ ...r, [k]: v });
    const save = async () => { setBusy(true); try { await q(sb.from("media_assets").update({ title: r.title, alt: r.alt, caption: r.caption, folder: r.folder, tags: r.tags, focal_x: r.focal_x, focal_y: r.focal_y, updated_at: new Date().toISOString() }).eq("id", id)); toast(t("Saved. Pages that use it change when they are next published.")); onChange(); } catch (e) { toast(message(e), "bad"); } setBusy(false); };
    const del = async () => {
      if (!(await ask(t("Remove from the library?"), t("If an older version of a page still uses it, it is hidden from the library but kept, so that version can be restored."), t("Remove"), true))) return;
      try { await rpc("delete_media", { p_id: id }); toast(t("Removed from the library.")); go("media"); } catch (e) { toast(message(e), "bad"); }
    };
    const inUse = r.usage.drafts.length + r.usage.live.length;
    return <>
      <PageHead title={r.title || r.filename} crumbs={[[t("Media"), href("media")], [r.title || r.filename]]} />
      <div class="grid2">
        <section class="card">
          <div class="focal" onClick={(e) => { const b = e.currentTarget.getBoundingClientRect(); s.set({ ...r, focal_x: Math.round(((e.clientX - b.left) / b.width) * 100) / 100, focal_y: Math.round(((e.clientY - b.top) / b.height) * 100) / 100 }); }}>
            {r.kind === "video" ? <video src={r.url} controls /> : <img src={r.url} alt={r.alt?.en || ""} />}
            {r.kind === "image" && <i class="fp" style={{ left: r.focal_x * 100 + "%", top: r.focal_y * 100 + "%" }} aria-hidden="true" />}
          </div>
          {r.kind === "image" && <p class="hint">{t("Click the picture to set the point that must stay in view when it is cropped.")}</p>}
          <dl class="meta"><dt>{t("Size")}</dt><dd>{r.width}×{r.height} · {mb(r.bytes)}</dd><dt>{t("Type")}</dt><dd>{r.mime}</dd><dt>{t("Added")}</dt><dd>{when(r.created_at)}</dd><dt>{t("Checked")}</dt><dd>{r.status === "ready" ? t("Yes") : `${t(r.status)} ${r.reject_reason || ""}`}</dd></dl>
        </section>
        <section class="card form">
          <Input label={t("Name")} value={r.title} onInput={(v) => set("title", v)} />
          <Bi label={t("Description for people who cannot see it")} value={r.alt} onInput={(v) => set("alt", v)} hint={t("Used wherever the page does not give its own.")} />
          <Bi label={t("Caption")} value={r.caption} onInput={(v) => set("caption", v)} />
          <div class="grid2"><Input label={t("Folder")} value={r.folder} onInput={(v) => set("folder", v)} /><Input label={t("Tags (comma separated)")} value={(r.tags || []).join(", ")} onInput={(v) => set("tags", v.split(",").map(x => x.trim()).filter(Boolean))} /></div>
          <Button kind="primary" busy={busy} onClick={save}>{t("Save")}</Button>
        </section>
      </div>
      <section class="card">
        <h2>{t("Where it is used")}</h2>
        {inUse ? <ul>{[...r.usage.drafts.map(x => [x, t("draft")]), ...r.usage.live.map(x => [x, t("live")])].map(([x, w]) => <li>{x.title || x.key} <Pill>{w}</Pill></li>)}</ul> : <p>{t("Not used on any page.")}</p>}
        {r.usage.history > 0 && <p class="hint">{t("Older versions use it {n} times; it is kept for them.", { n: r.usage.history })}</p>}
        <div class="row">
          {inUse > 0 && <Button onClick={() => setReplace(true)}>{t("Replace it everywhere…")}</Button>}
          <Button kind="danger" disabled={inUse > 0} onClick={del} title={inUse ? t("Remove it from those pages first") : ""}>{t("Remove from the library")}</Button>
        </div>
      </section>
      {replace && <ReplaceFlow old={r} usage={r.usage} onClose={() => { setReplace(false); s.reload(); }} />}
    </>;
  }}</Load>;
}

/* replacing a file everywhere: pick the new one, see which pages change, confirm */
function ReplaceFlow({ old, usage, onClose }) {
  const [pick, setPick] = useState(true), [nid, setNid] = useState(null), [busy, setBusy] = useState(false);
  if (pick) return <MediaPicker kind={old.kind} onClose={onClose} onPick={(ids) => { setNid(ids[0]); setPick(false); }} />;
  const docs = [...new Map([...usage.drafts, ...usage.live].map(x => [x.key, x])).values()];
  return <Modal title={t("Replace everywhere")} onClose={onClose} actions={<><Button onClick={onClose}>{t("Cancel")}</Button><Button kind="primary" busy={busy} onClick={async () => { setBusy(true); try { const touched = await rpc("replace_media", { p_old: old.id, p_new: nid }); toast(t("Replaced in {n} drafts. Preview them, then publish.", { n: touched.length })); onClose(); } catch (e) { toast(message(e), "bad"); setBusy(false); } }}>{t("Replace in the drafts")}</Button></>}>
    <p>{t("These pages will use the new file in their drafts. Nothing changes on the site until you publish them.")}</p>
    <ul>{docs.map(d => <li>{d.title || d.key}</li>)}</ul>
  </Modal>;
}
