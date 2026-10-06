// Languages and search. English and Hebrew are written into every page; French,
// Arabic and Russian are dictionaries the site loads when someone picks them,
// keyed by the English words. A missing translation shows the English.
import { useState, useEffect } from "preact/hooks";
import { sb, q, message, SITE } from "../lib/sb.js";
import { thumb } from "../lib/media.js";
import { MediaPicker } from "./Media.jsx";
import { t } from "../lib/i18n.js";
import { useDoc } from "../lib/doc.js";
import { href, go } from "../lib/router.js";
import { Bi, Input, Button, PageHead, Tabs, Load, useLoad, Pill, NotImported } from "../lib/ui.jsx";
import { SaveBar } from "./Products.jsx";
import { useInventory } from "./Pages.jsx";
import { toInline, safeInline } from "../../../site/src/content/apply.mjs";

const OTHER = [["fr", "Français", "ltr"], ["ar", "العربية", "rtl"], ["ru", "Русский", "ltr"]];

export function Languages({ tab = "search" }) {
  return <>
    <PageHead title={t("Languages & SEO")} sub={t("The sitemap, the language links between pages and the structured data for each piece are made by the site itself when it publishes.")} />
    <Tabs tabs={[["search", t("Search and sharing")], ...OTHER.map(([k, n]) => [k, n])]} value={tab} onChange={(k) => go("languages/" + k)} />
    {tab === "search" ? <SearchEdit /> : <Translate lang={tab} />}
  </>;
}

function ShareThumb({ img }) { const [u, set] = useState(""); useEffect(() => { thumb(img).then(set); }, [img]); return u ? <img class="thumb" src={u} alt="" /> : null; }
function SearchEdit() {
  const d = useDoc("seo", "seo", { title: "Search and sharing" });
  const [pick, setPick] = useState(false);
  if (d.loading) return <p>{t("Loading…")}</p>;
  if (d.error) return <p class="err">{message(d.error)}</p>;
  if (!d.data) return <NotImported />;
  const h = d.data.home;
  const setH = (k, v) => d.setData({ ...d.data, home: { ...h, [k]: v } });
  return <>
    <section class="card form">
      <h2>{t("The home page")}</h2>
      <Bi label={t("Title (in the tab and in search results)")} value={h.title} onInput={(v) => setH("title", v)} hint={t("About 60 characters. Now {n}.", { n: (h.title.en || "").length })} required />
      <Bi label={t("Description (under the title in search results)")} value={h.description} onInput={(v) => setH("description", v)} multiline rows={3} hint={t("About 155 characters. Now {n}.", { n: (h.description.en || "").length })} />
      <div class="serp"><div class="su">{SITE}</div><div class="st">{h.title.en}</div><div class="sd">{h.description.en}</div></div>
      <p class="hint">{t("Each piece's title and description are set on its own page in Products, and a piece is shared with its first photograph.")}</p>
    </section>
    <section class="card form">
      <h2>{t("The picture when the site is shared")}</h2>
      <p class="hint">{t("Shown by WhatsApp, Instagram, Facebook and others when someone shares the site. Best 1200 × 630 pixels. Without one, the designed SILAVU card is used.")}</p>
      <div class="row">{h.image ? <><ShareThumb img={h.image.media} /><Button kind="quiet" onClick={() => setH("image", undefined)}>{t("Use the designed SILAVU card")}</Button></> : <span class="hint">{t("The designed SILAVU card")}</span>}<Button onClick={() => setPick(true)}>{h.image ? t("Change the picture") : t("Choose a picture")}</Button></div>
      {h.image && <Bi label={t("Picture description")} value={h.image.alt || { en: "", he: "" }} onInput={(v) => setH("image", { ...h.image, alt: v })} />}
      {pick && <MediaPicker onClose={() => setPick(false)} onPick={async (ids) => { const r = await q(sb.from("media_assets").select("id,width,height").eq("id", ids[0]).maybeSingle()); setH("image", { media: "media:" + ids[0], w: r.width, h: r.height, alt: (h.image && h.image.alt) || { en: "", he: "" } }); setPick(false); }} />}
    </section>
    <SaveBar d={d} />
  </>;
}

function Translate({ lang }) {
  const inv = useInventory(), d = useDoc("translations", "translations", { title: "Other languages" }), strings = useDoc("strings", "strings", { title: "Page text" });
  const file = useLoad(async () => { const r = await fetch(SITE + "lang/" + lang + ".json", { cache: "no-store" }); return r.ok ? r.json() : {}; }, [lang]);
  const [onlyMissing, setOnly] = useState(true), [search, setSearch] = useState("");
  if (inv.loading || d.loading || strings.loading || file.loading) return <p>{t("Loading…")}</p>;
  if (inv.error || d.error) return <p class="err">{message(inv.error || d.error)}</p>;
  if (!d.data) return <NotImported />;
  const meta = OTHER.find(x => x[0] === lang), ov = d.data[lang] || {}, so = (strings.data && strings.data.overrides) || {}, dict = file.data || {};
  /* the key is the English the page shows now: an edited sentence needs its translation again */
  const rows = inv.data.strings.map(s => { const en = toInline((so[s.key] && so[s.key].en) || s.en); return { key: en, en, have: ov[en] ?? dict[en] ?? "" }; })
    .filter((r, i, a) => a.findIndex(x => x.key === r.key) === i)
    .filter(r => (!onlyMissing || !r.have) && (!search || (r.en + r.have).toLowerCase().includes(search.toLowerCase())));
  const missing = inv.data.strings.filter(s => { const en = toInline((so[s.key] && so[s.key].en) || s.en); return !(ov[en] ?? dict[en]); }).length;
  return <>
    <section class="card">
      <p>{missing ? <Pill tone="warn">{t("{n} sentences have no translation and show in English", { n: missing })}</Pill> : <Pill tone="ok">{t("Everything is translated")}</Pill>}</p>
      <div class="filters"><Input label={t("Find")} value={search} onInput={setSearch} /><label class="chk"><input type="checkbox" checked={onlyMissing} onChange={(e) => setOnly(e.target.checked)} /> {t("Only missing")}</label></div>
    </section>
    <section class="card"><div class="trs">{rows.slice(0, 200).map(r => <div class="tr"><div class="ten" dir="ltr" dangerouslySetInnerHTML={{ __html: safeInline(r.en) }} />
      <textarea dir={meta[2]} lang={lang} rows={2} aria-label={meta[1]} value={ov[r.key] ?? dict[r.key] ?? ""} onInput={(e) => d.setData({ ...d.data, [lang]: { ...ov, [r.key]: e.target.value } })} /></div>)}
      {rows.length > 200 && <p class="hint">{t("Showing the first 200; use Find to narrow.")}</p>}</div></section>
    <SaveBar d={d} />
  </>;
}
