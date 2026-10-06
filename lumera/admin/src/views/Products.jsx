// Products and the collection. A product is the piece exactly as the site
// renders it (card, piece window, its own page, the structured data, the
// enquiry's reference), so a change here reaches all of them when published.
import { useEffect, useState } from "preact/hooks";
import { sb, rpc, fn, q, message, SITE } from "../lib/sb.js";
import { t, getLang } from "../lib/i18n.js";
import { when, ago } from "../lib/time.js";
import { href, go } from "../lib/router.js";
import { useDoc, listDocs, getDoc } from "../lib/doc.js";
import { thumb } from "../lib/media.js";
import { Button, Input, TextArea, Select, Toggle, Bi, Pill, PageHead, Load, useLoad, ListEdit, DocState, Tabs, Modal, toast, ask, Empty, NotImported } from "../lib/ui.jsx";
import { MediaPicker } from "./Media.jsx";
import { Preview } from "./PreviewFrame.jsx";
import { Revisions } from "./History.jsx";
import { toInline, fromInline, safeInline } from "../../../site/src/content/apply.mjs";
import { formatMoney, priceWords } from "../../../site/src/content/money.mjs";

const CURS = ["ILS", "AED", "USD", "EUR"];
const S = (en = "", he = "") => ({ en, he });
/* stored as the site's markup (<em>…</em>); edited as text with *emphasis* */
const shown = (x) => x ? { en: fromInline(x.en), he: fromInline(x.he) } : S();
const stored = (x) => x ? { en: toInline(x.en || ""), he: toInline(x.he || "") } : S();

export function blankProduct(id) {
  return { id, ref: "", cat: "bracelets", light: true, widths: [640, 900, 1254], theme: "", word: "", title: S(), name: S(), kind: S(), plain: "", plainHe: "",
    line: S(), seo: S(), sub: S(), shots: [], meta: [S(), S(), S(), S("Price on request", "מחיר לפי בקשה")], key: [], stonesInside: true, story: S(), specs: [[S("Reference", "מק\"ט"), S()], [S("Price", "מחיר"), S("Price on request", "מחיר לפי בקשה")]],
    reserve: true, price: { mode: "on_request" }, status: "hidden", badge: null };
}

function Thumb({ img, alt }) {
  const [u, set] = useState(""); useEffect(() => { thumb(img).then(set); }, [img]);
  return u ? <img class="thumb" src={u} alt={alt || ""} loading="lazy" /> : <div class="thumb ph" aria-hidden="true" />;
}

export function Products({ role }) {
  const [tab, setTab] = useState("pieces");
  const s = useLoad(() => listDocs("product", true));
  const [order, setOrder] = useState(null), [busy, setBusy] = useState(false), [add, setAdd] = useState(false);
  useEffect(() => { if (s.data) setOrder(s.data.map(d => d.key)); }, [s.data]);
  const saveOrder = async (keys) => { setOrder(keys); setBusy(true); try { await rpc("set_doc_order", { p_keys: keys }); toast(t("Order saved. Publish to change it on the site.")); s.reload(); } catch (e) { toast(message(e), "bad"); } setBusy(false); };
  return <>
    <PageHead title={t("Products & collection")} sub={t("Drag to change the order of the collection. Changes are saved as drafts; publish to put them on the site.")}>
      {tab === "pieces" && <Button kind="primary" onClick={() => setAdd(true)}>+ {t("New product")}</Button>}
    </PageHead>
    <Tabs tabs={[["pieces", t("Products")], ["collection", t("Categories")]]} value={tab} onChange={setTab} />
    {tab === "collection" ? <Collection /> : <Load s={s} empty={(d) => !d.length}>{(docs) => {
      const by = Object.fromEntries(docs.map(d => [d.key, d]));
      const list = (order || docs.map(d => d.key)).map(k => by[k]).filter(Boolean);
      return <ListEdit items={list} removable={false} onChange={(l) => saveOrder(l.map(d => d.key))} render={(d) => {
        const p = d.draft, live = d.published_rev === d.draft_rev && !!d.archived_at === !!d.published_archived;
        return <a class="prow" href={href("products/" + p.id)}>
          <Thumb img={p.shots && p.shots[0] && p.shots[0].img} />
          <div><strong dangerouslySetInnerHTML={{ __html: safeInline((p.name && p.name.en) || p.id) }} /><div class="hint">{p.ref} · {t(p.cat)} · {priceWords(p.price)[getLang() === "he" ? "he" : "en"]}</div></div>
          <div class="pills">{d.archived_at ? <Pill tone="bad">{t("Archived")}</Pill> : p.exceptional ? <Pill>{t("Not in the collection grid")}</Pill> : p.status === "hidden" ? <Pill>{t("Hidden")}</Pill> : <Pill tone="ok">{t("Shown")}</Pill>}{!live && <Pill tone="info">{t("Unpublished changes")}</Pill>}{p.badge && p.badge.en && <Pill tone="gold">{p.badge.en}</Pill>}</div>
        </a>;
      }} />;
    }}</Load>}
    {add && <NewProduct onClose={() => setAdd(false)} existing={(s.data || []).map(d => d.draft.id)} />}
  </>;
}

function NewProduct({ onClose, existing, from }) {
  const [id, setId] = useState(from ? from.id + "-copy" : ""), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const create = async () => {
    const slug = id.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(slug)) return setErr(t("Use lower-case letters, numbers and hyphens, like silavu-aura."));
    if (existing.includes(slug)) return setErr(t("A product already uses this address."));
    setBusy(true);
    try {
      const data = from ? { ...JSON.parse(JSON.stringify(from)), id: slug, status: "hidden", ref: from.ref ? from.ref + "-2" : "" } : blankProduct(slug);
      await rpc("save_draft", { p_key: "product:" + slug, p_kind: "product", p_title: fromInline((data.name && data.name.en) || slug), p_data: data, p_expected_rev: 0, p_checkpoint: true });
      go("products/" + slug);
    } catch (e) { setErr(message(e)); setBusy(false); }
  };
  return <Modal title={from ? t("Duplicate this product") : t("New product")} onClose={onClose} actions={<><Button onClick={onClose}>{t("Cancel")}</Button><Button kind="primary" busy={busy} onClick={create}>{t("Create")}</Button></>}>
    <Input label={t("Its address on the site")} hint={t("Becomes {u}. It cannot be changed later without moving the page.", { u: SITE + "pieces/" + (id || "…") + "/" })} value={id} onInput={setId} error={err} />
    <p class="hint">{t("It starts hidden. Fill it in, preview it, then show it and publish.")}</p>
  </Modal>;
}

function Collection() {
  const d = useDoc("collections", "collections", { title: "Collection" });
  if (d.loading) return <p>{t("Loading…")}</p>;
  if (d.error) return <p class="err">{message(d.error)}</p>;
  if (!d.data) return <NotImported />;
  const set = (cats) => d.setData({ ...d.data, cats });
  return <section class="card">
    <p class="hint">{t("The filter buttons above the collection. \"All\" always comes first. A product shows under the category it names.")}</p>
    <ListEdit items={d.data.cats} onChange={set} add={() => ({ id: "new-" + Math.random().toString(36).slice(2, 6), en: "", he: "" })} addLabel={t("Add a category")} render={(c, up) => <div class="grid3">
      <Input label={t("Code")} value={c.id} onInput={(v) => up({ ...c, id: v.toLowerCase().replace(/[^a-z0-9-]/g, "") })} disabled={c.id === "all"} />
      <Input label="English" value={c.en} onInput={(v) => up({ ...c, en: v })} />
      <Input label="עברית" dir="rtl" value={c.he} onInput={(v) => up({ ...c, he: v })} /></div>} />
    <SaveBar d={d} />
  </section>;
}

/* the bar at the foot of every editor: where the work stands, and what to do with it */
export function SaveBar({ d, onPreview, extra, publishable = true }) {
  return <div class="savebar">
    <DocState doc={d.doc} dirty={d.dirty} saving={d.saving} conflict={d.conflict} />
    {d.conflict && <><Button onClick={d.reload}>{t("Load their version")}</Button><Button onClick={d.keepMine}>{t("Keep mine on top of theirs")}</Button></>}
    {d.restoredLocal && <span class="hint">{t("Unsaved work from earlier on this device was restored.")}</span>}
    <span class="grow" />
    {extra}
    {onPreview && <Button onClick={onPreview}>{t("Preview")}</Button>}
    <Button busy={d.saving} disabled={!d.dirty || d.conflict} onClick={() => d.save()}>{t("Save draft")}</Button>
    {publishable && <Button kind="primary" disabled={d.conflict} onClick={async () => { if (await ask(t("Publish this now?"), t("It goes on the public site with the next build, in both languages, wherever it appears."), t("Publish"))) d.publish(); }}>{t("Publish")}</Button>}
  </div>;
}

/* label / value rows (the key figures, the specification) */
function Rows({ rows, onChange, labelHint }) {
  return <ListEdit items={rows} onChange={onChange} add={() => [S(), S()]} addLabel={t("Add a row")} render={(r, up) => <div class="grid2">
    <Bi label={t("Label")} value={r[0]} onInput={(v) => up([v, r[1]])} wide={false} />
    <Bi label={t("Value")} value={shown(r[1])} onInput={(v) => up([r[0], stored(v)])} wide={false} hint={r[0] && r[0].en === "Price" ? t("Filled in from the price below.") : labelHint} />
  </div>} />;
}

export function ProductEdit({ id, role, onPublished }) {
  const d = useDoc("product:" + id, "product", { title: (x) => fromInline((x && x.name && x.name.en) || id) });
  const [tab, setTab] = useState("words"), [pick, setPick] = useState(false), [prev, setPrev] = useState(false), [dup, setDup] = useState(false);
  const cats = useLoad(async () => ((await getDoc("collections")) || { draft: { cats: [] } }).draft.cats.filter(c => c.id !== "all"));
  if (d.loading) return <p>{t("Loading…")}</p>;
  if (d.error) return <p class="err">{message(d.error)}</p>;
  if (!d.data) return <Empty title={t("There is no product at this address.")}><a href={href("products")}>{t("Back to products")}</a></Empty>;
  const p = d.data, set = (k, v) => d.setData({ ...p, [k]: v });
  const errs = [];
  if (!p.name?.en?.trim() || !p.name?.he?.trim()) errs.push(t("The name is needed in both languages."));
  if (!p.shots?.length) errs.push(t("At least one photograph is needed."));
  if (p.price?.mode !== "on_request" && !Object.values(p.price?.amounts || {}).some(v => v > 0)) errs.push(t("A price needs at least one amount."));
  const archived = !!d.doc?.archived_at;
  const archive = async (on) => {
    if (on && !(await ask(t("Archive this product?"), t("It leaves the site with the next publish. Nothing is deleted: you can restore it, and older quotes keep their copy."), t("Archive"), true))) return;
    if (d.dirty) await d.save({ quiet: true });
    try { await rpc("archive_doc", { p_key: "product:" + id, p_archived: on }); toast(on ? t("Archived. Publish to take it off the site.") : t("Restored. Publish to show it again.")); d.reload(); } catch (e) { toast(message(e), "bad"); }
  };
  const price = p.price || { mode: "on_request" };
  const setAmount = (cur, major) => set("price", { ...price, amounts: { ...(price.amounts || {}), [cur]: major === null || major === "" ? undefined : Math.round(Number(major) * 100) } });
  return <>
    <PageHead title={fromInline(p.name?.en || id).replace(/\*/g, "")} crumbs={[[t("Products"), href("products")], [p.id]]}>
      <Button onClick={() => setDup(true)}>{t("Duplicate")}</Button>
      {archived ? <Button onClick={() => archive(false)}>{t("Restore")}</Button> : <Button kind="quiet" onClick={() => archive(true)}>{t("Archive")}</Button>}
    </PageHead>
    {archived && <div class="notice warn">{t("Archived: it will not appear on the site.")}</div>}
    {p.exceptional && <div class="notice">{t("This piece is marked exceptional: the site does not show it in the collection grid or give it a page of its own. It is kept here as a record.")}</div>}
    {errs.length > 0 && <div class="notice">{errs.map(e => <div>{e}</div>)}</div>}
    <Tabs tabs={[["words", t("Words")], ["photos", t("Photographs & film")], ["details", t("Details")], ["price", t("Price & visibility")], ["seo", t("Search")], ...(role === "owner" ? [["internal", t("Internal")]] : []), ["history", t("History")]]} value={tab} onChange={setTab} />
    {tab === "words" && <section class="card form">
      <Bi label={t("Name (as on the card)")} hint={t("Put *stars* around the part shown in the piece's colour, e.g. SILAVU *MOMENT*.")} value={shown(p.name)} onInput={(v) => set("name", stored(v))} required />
      <Bi label={t("What it is")} hint={t("e.g. Bracelet")} value={p.kind} onInput={(v) => set("kind", v)} />
      <Bi label={t("One line")} value={shown(p.line)} onInput={(v) => set("line", stored(v))} multiline rows={2} required />
      <Bi label={t("The story (in the piece window and on its page)")} value={shown(p.story)} onInput={(v) => set("story", stored(v))} multiline rows={5} />
      <Bi label={t("The diamonds (optional)")} value={shown(p.stones)} onInput={(v) => set("stones", v.en || v.he ? stored(v) : undefined)} multiline rows={3} />
      <Bi label={t("Delivery and care (optional)")} value={shown(p.care)} onInput={(v) => set("care", v.en || v.he ? stored(v) : undefined)} multiline rows={3} />
      <div class="grid2"><Input label={t("Plain name, English (for enquiries and search)")} value={p.plain} onInput={(v) => set("plain", v)} /><Input label={t("Plain name, Hebrew")} dir="rtl" value={p.plainHe} onInput={(v) => set("plainHe", v)} /></div>
    </section>}
    {tab === "photos" && <section class="card form">
      <p class="hint">{t("The first photograph is the card's face, the second is what it turns to, and all of them make the gallery. Photographs of 1254 pixels or more stay sharp on every screen.")}</p>
      <ListEdit items={p.shots} onChange={(v) => set("shots", v)} render={(sh, up, i) => <div class="shot"><Thumb img={sh.img} alt={sh.alt?.en} /><div class="grow"><div class="hint">{i === 0 ? t("Card face") : i === 1 ? t("Card's second side") : t("Gallery")}</div><Bi label={t("Description for people who cannot see it")} value={sh.alt} onInput={(v) => up({ ...sh, alt: v })} /></div></div>} />
      <Button onClick={() => setPick(true)}>+ {t("Add photographs from the library")}</Button>
      <h3>{t("Film")}</h3>
      {p.film ? <div class="row"><span>{p.film.media ? t("A film from the library") : p.film.src}</span><Button kind="quiet" onClick={() => set("film", undefined)}>{t("Remove the film")}</Button></div> : <p class="hint">{t("No film. A film is shown first in the gallery on the piece's page.")}</p>}
      {p.film && <Bi label={t("Film description")} value={p.film.alt} onInput={(v) => set("film", { ...p.film, alt: v })} />}
      <Button onClick={() => setPick("film")}>{p.film ? t("Change the film") : t("Add a film from the library")}</Button>
      {pick && <MediaPicker kind={pick === "film" ? "video" : "image"} multiple={pick !== "film"} onClose={() => setPick(false)} onPick={(ids) => {
        if (pick === "film") set("film", { ...(p.film || {}), media: "media:" + ids[0], src: undefined, poster: undefined, alt: (p.film && p.film.alt) || S() });
        else set("shots", [...p.shots, ...ids.map(i => ({ img: "media:" + i, alt: S() }))]);
        setPick(false);
      }} />}
    </section>}
    {tab === "details" && <section class="card form">
      <div class="grid3">
        <Input label={t("Reference (SKU)")} value={p.ref} onInput={(v) => { set("ref", v); }} />
        <Select label={t("Category")} value={p.cat} onChange={(v) => set("cat", v)} options={(cats.data || []).map(c => ({ value: c.id, label: getLang() === "he" ? c.he : c.en }))} />
        <Select label={t("Colour of its window")} value={p.theme || ""} onChange={(v) => set("theme", v)} options={[{ value: "", label: t("None") }, { value: "moment", label: "MOMENT" }, { value: "icon", label: "ICON" }, { value: "soul", label: "SOUL" }]} />
      </div>
      <Input label={t("Word written large behind its window")} value={p.word} onInput={(v) => set("word", v)} />
      <Toggle label={t("It has diamonds (the window promises stone reports)")} checked={p.stonesInside !== false} onChange={(v) => set("stonesInside", v)} />
      <Toggle label={t("Photographed on white")} checked={!!p.light} onChange={(v) => set("light", v)} />
      <h3>{t("Under the name on the card")}</h3><p class="hint">{t("Four short figures; the last is always the price.")}</p>
      <div class="grid3">{(p.meta || []).slice(0, 3).map((m, i) => <Bi label={t("Figure {n}", { n: i + 1 })} value={m} wide={false} onInput={(v) => { const n = [...p.meta]; n[i] = v; set("meta", n); }} />)}</div>
      <h3>{t("Above the fold of its window")}</h3><Rows rows={p.key || []} onChange={(v) => set("key", v)} />
      <h3>{t("Specification")}</h3><Rows rows={p.specs || []} onChange={(v) => set("specs", v)} />
    </section>}
    {tab === "price" && <section class="card form">
      <fieldset class="radios"><legend>{t("Price")}</legend>
        {[["on_request", t("Price on request")], ["exact", t("A set price")], ["from", t("A starting price (\"From …\")")]].map(([v, l]) => <label><input type="radio" name="pm" checked={price.mode === v} onChange={() => set("price", { ...price, mode: v })} /> {l}</label>)}
      </fieldset>
      {price.mode !== "on_request" && <>
        <p class="hint">{t("Enter the amount in each currency you quote. Nothing is converted automatically and there are no live exchange rates.")}</p>
        <div class="grid4">{CURS.map(c => <Input type="number" min="0" step="1" label={c} value={price.amounts && price.amounts[c] != null ? price.amounts[c] / 100 : ""} onInput={(v) => setAmount(c, v)} hint={price.amounts && price.amounts[c] ? formatMoney(price.amounts[c], c).en : ""} />)}</div>
        <Select label={t("Shown on the site in")} value={price.base || ""} onChange={(v) => set("price", { ...price, base: v || undefined })} options={[{ value: "", label: t("The first one filled in") }, ...CURS.filter(c => price.amounts && price.amounts[c]).map(c => ({ value: c, label: c }))]} />
      </>}
      <p>{t("The site will say:")} <strong>{priceWords(price).en}</strong> · <strong dir="rtl">{priceWords(price).he.replace(/[⁦⁩]/g, "")}</strong></p>
      <h3>{t("On the site")}</h3>
      <Toggle label={t("Shown in the collection")} checked={p.status !== "hidden"} onChange={(v) => set("status", v ? "live" : "hidden")} hint={t("Hidden products keep their page out of the site and the sitemap.")} />
      <Toggle label={t("Can be reserved")} checked={p.reserve !== false} onChange={(v) => set("reserve", v)} />
      <Bi label={t("Badge (optional, e.g. New)")} value={p.badge || S()} onInput={(v) => set("badge", v.en || v.he ? v : null)} />
    </section>}
    {tab === "seo" && <section class="card form">
      <Bi label={t("Title in search results")} value={p.seo} onInput={(v) => set("seo", v)} hint={t("About 60 characters.")} />
      <Bi label={t("Short line under the title on its page")} value={p.sub} onInput={(v) => set("sub", v)} />
      <Bi label={t("Tab title")} value={p.title} onInput={(v) => set("title", v)} />
    </section>}
    {tab === "internal" && role === "owner" && <Internal id={id} />}
    {tab === "history" && <Revisions docKey={"product:" + id} onRestored={d.reload} />}
    <SaveBar d={d} onPreview={() => setPrev(true)} />
    {prev && <Preview onClose={() => setPrev(false)} build={(lang) => ({ kind: "home", piece: p, lang })} />}
    {dup && <NewProduct from={p} existing={[]} onClose={() => setDup(false)} />}
  </>;
}

/* cost, supplier, notes: owner only, never published, not part of a draft */
function Internal({ id }) {
  const s = useLoad(async () => (await q(sb.from("product_private").select("*").eq("product_key", "product:" + id).maybeSingle())) || { product_key: "product:" + id, cost_minor: null, cost_currency: "ILS", supplier: "", internal_notes: "" });
  const [busy, setBusy] = useState(false);
  return <Load s={s}>{(r) => <section class="card form">
    <p class="hint">{t("Only the owner sees this. It is never published and never part of a quote's customer copy.")}</p>
    <div class="grid3"><Input type="number" label={t("Cost")} value={r.cost_minor != null ? r.cost_minor / 100 : ""} onInput={(v) => s.set({ ...r, cost_minor: v == null ? null : Math.round(v * 100) })} />
      <Select label={t("Currency")} value={r.cost_currency || "ILS"} onChange={(v) => s.set({ ...r, cost_currency: v })} options={CURS.map(c => ({ value: c, label: c }))} />
      <Input label={t("Supplier")} value={r.supplier} onInput={(v) => s.set({ ...r, supplier: v })} /></div>
    <TextArea label={t("Notes")} value={r.internal_notes} onInput={(v) => s.set({ ...r, internal_notes: v })} />
    <Button kind="primary" busy={busy} onClick={async () => { setBusy(true); try { await q(sb.from("product_private").upsert({ product_key: r.product_key, cost_minor: r.cost_minor, cost_currency: r.cost_currency, supplier: r.supplier, internal_notes: r.internal_notes, updated_at: new Date().toISOString() }, { onConflict: "product_key" })); toast(t("Saved.")); } catch (e) { toast(message(e), "bad"); } setBusy(false); }}>{t("Save")}</Button>
  </section>}</Load>;
}
