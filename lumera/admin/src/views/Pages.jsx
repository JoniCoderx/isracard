// Pages and text: the home page's chapters and text bands, every sentence the
// pages show (in both languages), menus and moved pages, the policies, About,
// and new pages made from the document template.
import { useEffect, useMemo, useState } from "preact/hooks";
import { sb, rpc, q, message, SITE } from "../lib/sb.js";
import { t, getLang } from "../lib/i18n.js";
import { href, go } from "../lib/router.js";
import { useDoc, listDocs } from "../lib/doc.js";
import { Button, Input, Select, Toggle, Bi, Pill, PageHead, Load, useLoad, ListEdit, Tabs, Modal, toast, ask, Empty, NotImported } from "../lib/ui.jsx";
import { SaveBar } from "./Products.jsx";
import { MediaPicker } from "./Media.jsx";
import { Preview } from "./PreviewFrame.jsx";
import { Revisions } from "./History.jsx";
import { HOME_SECTIONS, BLOCK_SLOTS } from "../../../site/src/content/sections.mjs";
import { safeHref, fromInline, toInline } from "../../../site/src/content/apply.mjs";
import { thumb } from "../lib/media.js";

const S = (en = "", he = "") => ({ en, he });
const L = (x) => (getLang() === "he" ? x.he : x.en);
export const useInventory = () => useLoad(async () => { const r = await fetch("inventory.json", { cache: "no-store" }); if (!r.ok) throw new Error(t("The list of page texts is missing from this build of the admin.")); return r.json(); });

export function Pages({ tab = "home", item, role, onChange }) {
  const tabs = [["home", t("Home chapters")], ["text", t("Page text")], ["menus", t("Menus")], ["pages", t("Pages")], ["policies", t("Policies")], ["about", t("About")]];
  return <>
    <PageHead title={t("Pages & text")} />
    <Tabs tabs={tabs} value={tab} onChange={(k) => go("pages/" + k)} />
    {tab === "home" && <HomeChapters />}
    {tab === "text" && <PageText focus={item} />}
    {tab === "menus" && <Menus />}
    {tab === "pages" && (item ? <DocPageEdit slug={item} /> : <DocPages />)}
    {tab === "policies" && (item ? <PolicyEdit slug={item} /> : <Policies />)}
    {tab === "about" && <AboutEdit />}
  </>;
}

/* ── the home page's chapters ─────────────────────────────────────────── */
function HomeChapters() {
  const d = useDoc("page:home", "page", { title: "Home page" });
  const [pick, setPick] = useState(null), [prev, setPrev] = useState(false);
  if (d.loading) return <p>{t("Loading…")}</p>;
  if (d.error) return <p class="err">{message(d.error)}</p>;
  if (!d.data) return <NotImported />;
  const h = d.data, setSec = (id, hidden) => d.setData({ ...h, sections: { ...h.sections, [id]: { ...(h.sections[id] || {}), hidden } } });
  const setBlocks = (blocks) => d.setData({ ...h, blocks });
  return <>
    <section class="card">
      <h2>{t("Chapters")}</h2>
      <p class="hint">{t("The chapters are a designed sequence and keep their order. Those marked may be hidden; every link to a hidden chapter is removed with it.")}</p>
      <ul class="chapters">{HOME_SECTIONS.map(s => <li>
        <span>{L(s.label)}</span>
        {s.hideable ? <Toggle label={t("Shown")} checked={!(h.sections[s.id] && h.sections[s.id].hidden)} onChange={(v) => setSec(s.id, !v)} /> : <Pill>{t("Always shown")}</Pill>}
        {s.id === "build" && h.sections.build && h.sections.build.hidden && <span class="hint warnx">{t("Hiding The Line also removes its menu links and the try-on.")}</span>}
      </li>)}</ul>
    </section>
    <section class="card">
      <h2>{t("Text bands")}</h2>
      <p class="hint">{t("A band of words (and a picture, if you like) between two chapters. Use them sparingly: the chapters are the event.")}</p>
      <ListEdit items={h.blocks || []} onChange={setBlocks} add={() => ({ id: Math.random().toString(36).slice(2, 8), after: "collection", theme: "light", eyebrow: S(), title: S(), text: S(), cta: { label: S(), href: "#concierge" }, hidden: false })} addLabel={t("Add a band")}
        render={(b, up) => <div class="form">
          <div class="grid3">
            <Select label={t("Placed after")} value={b.after} onChange={(v) => up({ ...b, after: v })} options={BLOCK_SLOTS.map(id => ({ value: id, label: L(HOME_SECTIONS.find(s => s.id === id).label) }))} />
            <Select label={t("Look")} value={b.theme} onChange={(v) => up({ ...b, theme: v })} options={[{ value: "light", label: t("Ivory") }, { value: "dark", label: t("Black") }]} />
            <Toggle label={t("Shown")} checked={!b.hidden} onChange={(v) => up({ ...b, hidden: !v })} />
          </div>
          <Bi label={t("Small heading above (optional)")} value={b.eyebrow} onInput={(v) => up({ ...b, eyebrow: v })} />
          <Bi label={t("Title")} value={b.title} onInput={(v) => up({ ...b, title: v })} hint={t("*Stars* around words set them in italic.")} />
          <Bi label={t("Text")} value={b.text} onInput={(v) => up({ ...b, text: v })} multiline />
          <div class="grid2"><Bi label={t("Button (optional)")} value={b.cta.label} onInput={(v) => up({ ...b, cta: { ...b.cta, label: v } })} wide={false} />
            <Input label={t("Button goes to")} value={b.cta.href} onInput={(v) => up({ ...b, cta: { ...b.cta, href: v } })} error={b.cta.href && !safeHref(b.cta.href) ? t("Use a page on this site (like about/ or #concierge), or a full https:// address.") : ""} /></div>
          <div class="row">{b.image ? <><Thumbnail img={b.image} /><Button kind="quiet" onClick={() => up({ ...b, image: null })}>{t("Remove the picture")}</Button></> : null}<Button onClick={() => setPick(b.id)}>{b.image ? t("Change the picture") : t("Add a picture")}</Button></div>
          {b.image && <Bi label={t("Picture description")} value={b.alt || S()} onInput={(v) => up({ ...b, alt: v })} />}
        </div>} />
      {pick && <MediaPicker onClose={() => setPick(null)} onPick={(ids) => { setBlocks(h.blocks.map(x => x.id === pick ? { ...x, image: "media:" + ids[0] } : x)); setPick(null); }} />}
    </section>
    <SaveBar d={d} onPreview={() => setPrev(true)} />
    {prev && <Preview onClose={() => setPrev(false)} build={() => ({ kind: "home", home: h, scrollTo: h.blocks && h.blocks[0] ? "#b-" + h.blocks[0].id : null })} />}
  </>;
}
function Thumbnail({ img }) { const [u, set] = useState(""); useEffect(() => { thumb(img).then(set); }, [img]); return u ? <img class="thumb" src={u} alt="" /> : null; }

/* ── every sentence on the pages ─────────────────────────────────────── */
const SECTION_NAME = Object.fromEntries([...HOME_SECTIONS.map(s => [s.id, s.label]), ["chrome", S("Header, menu and buttons outside the chapters", "כותרת, תפריט וכפתורים מחוץ לפרקים")]]);

function PageText({ focus }) {
  const inv = useInventory();
  const d = useDoc("strings", "strings", { title: "Page text" });
  const [search, setSearch] = useState(""), [open, setOpen] = useState(focus || ""), [prev, setPrev] = useState(null);
  if (inv.loading || d.loading) return <p>{t("Loading…")}</p>;
  if (inv.error) return <p class="err">{message(inv.error)}</p>;
  if (d.error) return <p class="err">{message(d.error)}</p>;
  if (!d.data) return <NotImported />;
  const ov = (d.data && d.data.overrides) || {}, published = (d.doc && d.doc.published && d.doc.published.overrides) || {};
  const setOv = (key, v) => { const n = { ...ov }; if (v) n[key] = v; else delete n[key]; d.setData({ ...d.data, overrides: n }); };
  const items = inv.data.strings.filter(s => !search || (s.en + " " + s.he + " " + ((ov[s.key] || {}).en || "") + " " + ((ov[s.key] || {}).he || "")).toLowerCase().includes(search.toLowerCase()));
  const groups = [...new Set(items.map(s => s.section))];
  return <>
    <section class="card">
      <p class="hint">{t("Every sentence, label and button on the home page, in English and Hebrew. Product words are edited in Products, the documents in Policies. Leave a field as it is to keep the original.")}</p>
      <Input label={t("Find a text")} value={search} onInput={setSearch} />
    </section>
    {groups.map(g => {
      const list = items.filter(s => s.section === g), changed = list.filter(s => ov[s.key]).length;
      const isOpen = open === g || !!search;
      return <section class="card">
        <button type="button" class="acc" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? "" : g)}><span>{SECTION_NAME[g] ? L(SECTION_NAME[g]) : g}</span><span>{list.length} {changed ? <Pill tone="info">{t("{n} changed", { n: changed })}</Pill> : null}</span></button>
        {isOpen && <div class="strs">{list.map(s => <StringRow s={s} o={ov[s.key]} onChange={(v) => setOv(s.key, v)} />)}
          <Button onClick={() => setPrev(g)}>{t("Preview this chapter")}</Button></div>}
      </section>;
    })}
    <SaveBar d={d} onPreview={() => setPrev(open || "hero")} />
    {prev && <Preview onClose={() => setPrev(null)} build={() => ({ kind: "home", inventory: inv.data.strings, strings: { published, draft: ov }, scrollTo: prev === "chrome" ? null : "#" + prev })} />}
  </>;
}

function StringRow({ s, o, onChange }) {
  const cur = o || {}, val = { en: cur.en ?? s.en, he: cur.he ?? s.he };
  const set = (v) => { const n = { ...cur, ...v }; if ((n.en ?? s.en) === s.en) delete n.en; if ((n.he ?? s.he) === s.he) delete n.he; if (n.href === s.href) delete n.href; if (!n.hidden) delete n.hidden; onChange(Object.keys(n).length ? n : null); };
  return <div class={"str" + (o ? " changed" : "")}>
    <Bi label={s.tag === "a" || s.tag === "button" ? t("Button or link") : t("Text")} value={val} onInput={(v) => set({ en: v.en, he: v.he })} multiline={s.en.length > 70} rows={2} />
    {s.tag === "a" && s.href !== null && <div class="grid2">
      <Input label={t("Goes to")} value={cur.href ?? s.href} onInput={(v) => set({ href: v })} error={(cur.href && !safeHref(cur.href)) ? t("Use a page on this site (like about/ or #concierge), or a full https:// address.") : ""} />
      <Toggle label={t("Remove this link from the page")} checked={!!cur.hidden} onChange={(v) => set({ hidden: v })} /></div>}
    {o && <button type="button" class="linkb" onClick={() => onChange(null)}>{t("Back to the original")}</button>}
  </div>;
}

/* ── menus and moved pages ───────────────────────────────────────────── */
function Menus() {
  const d = useDoc("navigation", "navigation", { title: "Menus" });
  if (d.loading) return <p>{t("Loading…")}</p>;
  if (d.error) return <p class="err">{message(d.error)}</p>;
  if (!d.data) return <NotImported />;
  const n = d.data;
  return <>
    <section class="card">
      <h2>{t("Extra links")}</h2>
      <p class="hint">{t("The existing menu items are edited in Page text (their words and where they go, or removed). Add new ones here.")}</p>
      <ListEdit items={n.extra || []} onChange={(v) => d.setData({ ...n, extra: v })} add={() => ({ slot: "footer", label: S(), href: "" })} addLabel={t("Add a link")} render={(x, up) => <div class="form">
        <div class="grid2"><Select label={t("Where")} value={x.slot} onChange={(v) => up({ ...x, slot: v })} options={[{ value: "top", label: t("Top menu") }, { value: "footer", label: t("Footer, under Explore") }]} />
          <Input label={t("Goes to")} value={x.href} onInput={(v) => up({ ...x, href: v })} error={x.href && !safeHref(x.href) ? t("Use a page on this site (like about/ or #concierge), or a full https:// address.") : ""} /></div>
        <Bi label={t("Words")} value={x.label} onInput={(v) => up({ ...x, label: v })} required /></div>} />
    </section>
    <section class="card">
      <h2>{t("Moved pages")}</h2>
      <p class="hint">{t("When a page's address changes, the old address forwards readers to the new one. (GitHub Pages cannot send a true redirect; the old address gets a small forwarding page that search engines understand.)")}</p>
      <ListEdit items={n.redirects || []} onChange={(v) => d.setData({ ...n, redirects: v })} add={() => ({ from: "", to: "" })} addLabel={t("Add a moved page")} render={(x, up) => <div class="grid2">
        <Input label={t("Old address")} value={x.from} onInput={(v) => up({ ...x, from: v })} hint="pieces/old-name/" error={x.from && !/^[a-z0-9][a-z0-9/_-]*\/$/.test(x.from) ? t("Like pieces/old-name/ (no leading slash, ending in /).") : ""} />
        <Input label={t("New address")} value={x.to} onInput={(v) => up({ ...x, to: v })} hint="pieces/new-name/" /></div>} />
    </section>
    <SaveBar d={d} />
  </>;
}

/* ── pages made from the document template ───────────────────────────── */
function DocPages() {
  const s = useLoad(() => listDocs("docpage", true));
  const [slug, setSlug] = useState(""), [err, setErr] = useState(""), [add, setAdd] = useState(false);
  const create = async () => {
    const sl = slug.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{0,60}$/.test(sl)) return setErr(t("Use lower-case letters, numbers and hyphens."));
    try { await rpc("save_draft", { p_key: "docpage:" + sl, p_kind: "docpage", p_title: sl, p_data: { slug: sl, title: S(), lede: S(), eyebrow: S(), blocks: [{ type: "paragraph", text: S() }], footer: true, status: "live", seo: { title: S(), description: S() } }, p_expected_rev: 0, p_checkpoint: true }); go("pages/pages/" + sl); }
    catch (e) { setErr(message(e)); }
  };
  return <section class="card">
    <div class="row"><h2 class="grow">{t("Pages")}</h2><Button kind="primary" onClick={() => setAdd(true)}>+ {t("New page")}</Button></div>
    <p class="hint">{t("A page in the style of the house's documents: a title, an introduction, then headings, paragraphs, pictures and buttons. It gets its own address and, if you like, a link under Client care.")}</p>
    <Load s={s} empty={(x) => !x.length}>{(docs) => <ul class="plain">{docs.map(d => <li><a href={href("pages/pages/" + d.draft.slug)}>{fromInline(d.draft.title.en) || d.draft.slug}</a> <span class="hint">{SITE}{d.draft.slug}/</span> {d.archived_at && <Pill tone="bad">{t("Archived")}</Pill>}{d.published_rev !== d.draft_rev && <Pill tone="info">{t("Unpublished changes")}</Pill>}</li>)}</ul>}</Load>
    {add && <Modal title={t("New page")} onClose={() => setAdd(false)} actions={<><Button onClick={() => setAdd(false)}>{t("Cancel")}</Button><Button kind="primary" onClick={create}>{t("Create")}</Button></>}>
      <Input label={t("Its address")} hint={SITE + (slug || "…") + "/"} value={slug} onInput={setSlug} error={err} /></Modal>}
  </section>;
}

function DocPageEdit({ slug }) {
  const d = useDoc("docpage:" + slug, "docpage", { title: (x) => (x && x.title && x.title.en) || slug });
  const [prev, setPrev] = useState(false), [pick, setPick] = useState(null);
  if (d.loading) return <p>{t("Loading…")}</p>;
  if (d.error || !d.data) return <p class="err">{d.error ? message(d.error) : t("There is no page at this address.")}</p>;
  const p = d.data, set = (k, v) => d.setData({ ...p, [k]: v });
  const archive = async (on) => { if (on && !(await ask(t("Take this page off the site?"), t("It is archived, not deleted. Publish to take it down."), t("Archive"), true))) return; if (d.dirty) await d.save({ quiet: true }); try { await rpc("archive_doc", { p_key: "docpage:" + slug, p_archived: on }); d.reload(); } catch (e) { toast(message(e), "bad"); } };
  return <>
    <div class="row"><a href={href("pages/pages")}>← {t("Pages")}</a><span class="grow" />{d.doc?.archived_at ? <Button onClick={() => archive(false)}>{t("Restore")}</Button> : <Button kind="quiet" onClick={() => archive(true)}>{t("Archive")}</Button>}</div>
    <section class="card form">
      <Bi label={t("Title")} value={p.title} onInput={(v) => set("title", v)} required />
      <Bi label={t("Small heading above (optional)")} value={p.eyebrow} onInput={(v) => set("eyebrow", v)} />
      <Bi label={t("Introduction")} value={p.lede} onInput={(v) => set("lede", v)} multiline rows={2} />
      <h3>{t("Content")}</h3>
      <ListEdit items={p.blocks} onChange={(v) => set("blocks", v)} render={(b, up) => <div class="form">
        <Select label={t("Kind")} value={b.type} onChange={(v) => up({ type: v, text: b.text || S(), label: b.label || S(), href: b.href || "", alt: b.alt || S(), caption: b.caption || S(), image: b.image })} options={[{ value: "heading", label: t("Heading") }, { value: "paragraph", label: t("Paragraph") }, { value: "image", label: t("Picture") }, { value: "button", label: t("Button") }]} />
        {(b.type === "heading" || b.type === "paragraph") && <Bi label={b.type === "heading" ? t("Heading") : t("Paragraph")} value={b.text} onInput={(v) => up({ ...b, text: v })} multiline={b.type === "paragraph"} rows={4} hint={t("*Stars* around words set them in italic.")} />}
        {b.type === "image" && <><div class="row">{b.image && <Thumbnail img={b.image} />}<Button onClick={() => setPick(p.blocks.indexOf(b))}>{b.image ? t("Change the picture") : t("Choose a picture")}</Button></div><Bi label={t("Picture description")} value={b.alt} onInput={(v) => up({ ...b, alt: v })} /><Bi label={t("Caption (optional)")} value={b.caption} onInput={(v) => up({ ...b, caption: v })} /></>}
        {b.type === "button" && <div class="grid2"><Bi label={t("Words")} value={b.label} onInput={(v) => up({ ...b, label: v })} wide={false} /><Input label={t("Goes to")} value={b.href} onInput={(v) => up({ ...b, href: v })} error={b.href && !safeHref(b.href) ? t("Use a page on this site (like about/ or #concierge), or a full https:// address.") : ""} /></div>}
      </div>} add={() => ({ type: "paragraph", text: S() })} addLabel={t("Add a block")} />
      <Toggle label={t("Listed under Client care in the footer")} checked={p.footer !== false} onChange={(v) => set("footer", v)} />
      <Bi label={t("Title in search results (optional)")} value={(p.seo && p.seo.title) || S()} onInput={(v) => set("seo", { ...(p.seo || {}), title: v })} />
      <Bi label={t("Description in search results (optional)")} value={(p.seo && p.seo.description) || S()} onInput={(v) => set("seo", { ...(p.seo || {}), description: v })} multiline rows={2} />
    </section>
    {pick != null && <MediaPicker onClose={() => setPick(null)} onPick={(ids) => { set("blocks", p.blocks.map((x, i) => i === pick ? { ...x, image: "media:" + ids[0] } : x)); setPick(null); }} />}
    <Revisions docKey={"docpage:" + slug} onRestored={d.reload} compact />
    <SaveBar d={d} onPreview={() => setPrev(true)} />
    {prev && <Preview onClose={() => setPrev(false)} build={() => ({ kind: "doc", docKind: "docpage", data: p })} />}
  </>;
}

/* ── the house documents ─────────────────────────────────────────────── */
function Policies() {
  const s = useLoad(() => listDocs("policy", true));
  return <section class="card"><p class="hint">{t("Privacy, Terms and the other documents in the footer.")}</p>
    <Load s={s}>{(docs) => <ul class="plain">{docs.map(d => <li><a href={href("pages/policies/" + d.draft.slug)}>{L(d.draft.title)}</a> {d.published_rev !== d.draft_rev && <Pill tone="info">{t("Unpublished changes")}</Pill>}</li>)}</ul>}</Load></section>;
}
function PolicyEdit({ slug }) {
  const d = useDoc("policy:" + slug, "policy", { title: (x) => (x && x.title && x.title.en) || slug });
  const [prev, setPrev] = useState(false);
  if (d.loading) return <p>{t("Loading…")}</p>;
  if (d.error || !d.data) return <p class="err">{d.error ? message(d.error) : t("There is no document at this address.")}</p>;
  const p = d.data, set = (k, v) => d.setData({ ...p, [k]: v });
  const toks = JSON.stringify(p).match(/\{\{\w+\}\}/g);
  return <>
    <div class="row"><a href={href("pages/policies")}>← {t("Policies")}</a></div>
    {toks && <div class="notice">{t("Parts written as {{…}} are filled in by the site with the sentence that is true for how it is set up (where enquiries go, what is counted). Leave them in place.")}</div>}
    <section class="card form">
      <Bi label={t("Title")} value={p.title} onInput={(v) => set("title", v)} required />
      <Bi label={t("Introduction")} value={p.lede} onInput={(v) => set("lede", v)} multiline rows={2} />
      <ListEdit items={p.body} onChange={(v) => set("body", v)} add={() => [S(), S()]} addLabel={t("Add a section")} render={(r, up) => <div class="form">
        <Bi label={t("Heading")} value={r[0]} onInput={(v) => up([v, r[1]])} />
        <Bi label={t("Text")} value={r[1]} onInput={(v) => up([r[0], v])} multiline rows={5} /></div>} />
    </section>
    <Revisions docKey={"policy:" + slug} onRestored={d.reload} compact />
    <SaveBar d={d} onPreview={() => setPrev(true)} />
    {prev && <Preview onClose={() => setPrev(false)} build={() => ({ kind: "doc", docKind: "policy", data: p })} />}
  </>;
}

function AboutEdit() {
  const d = useDoc("about", "about", { title: "About" });
  if (d.loading) return <p>{t("Loading…")}</p>;
  if (d.error || !d.data) return <p class="err">{d.error ? message(d.error) : t("Not found.")}</p>;
  const a = d.data, set = (k, v) => d.setData({ ...a, [k]: v });
  const sh = (x) => x ? { en: fromInline(x.en), he: fromInline(x.he) } : S(), st = (x) => ({ en: toInline(x.en), he: toInline(x.he) });
  return <>
    <section class="card form">
      <Bi label={t("Title in search results and the tab")} value={a.seo} onInput={(v) => set("seo", v)} />
      <Bi label={t("Description in search results")} value={a.desc} onInput={(v) => set("desc", v)} multiline rows={2} />
      <Bi label={t("Small heading above")} value={a.eyebrow} onInput={(v) => set("eyebrow", v)} />
      <Bi label={t("Heading")} value={sh(a.h1)} onInput={(v) => set("h1", st(v))} hint={t("*Stars* around words set them in italic.")} />
      <div class="grid2"><Bi label={t("Name")} value={a.name} onInput={(v) => set("name", v)} wide={false} /><Bi label={t("Role")} value={a.role} onInput={(v) => set("role", v)} wide={false} /></div>
      <h3>{t("The letter")}</h3>
      <ListEdit items={a.letter} onChange={(v) => set("letter", v)} add={() => S()} addLabel={t("Add a paragraph")} render={(x, up) => <Bi label={t("Paragraph")} value={sh(x)} onInput={(v) => up(st(v))} multiline rows={4} />} />
      <div class="grid2"><Bi label={t("First button")} value={a.cta1} onInput={(v) => set("cta1", v)} wide={false} /><Bi label={t("Second button")} value={a.cta2} onInput={(v) => set("cta2", v)} wide={false} /></div>
      <p class="hint">{t("The portrait is a file in the site's code (public/ariel-silas-*.jpg); replacing it is a code change.")}</p>
    </section>
    <Revisions docKey="about" onRestored={d.reload} compact />
    <SaveBar d={d} />
  </>;
}
