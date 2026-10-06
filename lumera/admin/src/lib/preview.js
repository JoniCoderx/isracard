// Previews use the storefront's own rendering: the live page, with the draft
// laid over it by the same functions the build uses (site/src/content/*), the
// storefront's own card template, and the live stylesheet. They are shown in
// a frame inside the signed-in admin only: never cached publicly, never
// indexed, never at a public address. Library pictures that are not live yet
// are shown from their private originals through short-lived signed links.
import { sb, SITE } from "./sb.js";
import { applyStrings, applySections, applySettings, applyConfigurator, applyNav, blockHtml, stringInventory, toInline, fnv } from "../../../site/src/content/apply.mjs";
import { policyMain, docpageMain } from "../../../site/src/content/templates.mjs";
import { priceWords } from "../../../site/src/content/money.mjs";
import { pieceCard } from "../../../site/src/body.mjs";

const cache = new Map();
export async function live(path) {
  if (cache.has(path)) return cache.get(path);
  const p = fetch(SITE + path + (path.includes("?") ? "&" : "?") + "preview=" + Date.now(), { cache: "no-store" }).then(r => { if (!r.ok) throw new Error("The live page " + path + " could not be read (" + r.status + ")."); return r.text(); });
  cache.set(path, p); p.catch(() => cache.delete(path)); setTimeout(() => cache.delete(path), 60000);
  return p;
}

/* library pictures by id: a signed link to the original, cached for the session */
const signed = new Map();
export async function mediaUrl(id) {
  if (signed.has(id)) return signed.get(id);
  const { data: row } = await sb.from("media_assets").select("path").eq("id", id).maybeSingle();
  if (!row) return "";
  const { data } = await sb.storage.from("media").createSignedUrl(row.path, 3600);
  const u = data ? data.signedUrl : ""; signed.set(id, u); return u;
}
async function swapLibraryImages(html) {
  const ids = [...new Set((html.match(/m-([0-9a-f-]{36})-(?:640|900|1254|poster)\.jpg/g) || []).map(x => x.slice(2, 38)))];
  for (const id of ids) { const u = await mediaUrl(id); if (u) html = html.replace(new RegExp(`(?:\\.?/)?img/m-${id}-(?:640|900|1254|poster)\\.jpg`, "g"), u); }
  return html;
}

const EXTRA_CSS = `.cmsband{padding:clamp(88px,12vw,168px) 0}.cmsband.light{background:#f8f7f5;color:#14130f}.cmsband.dark{background:#0a0a0a;color:#f4f1ea}.cmsband .cmsin{display:grid;gap:clamp(28px,5vw,72px);align-items:center;justify-items:center;text-align:center}.cmsband.withfig .cmsin{justify-items:stretch;text-align:start}@media(min-width:900px){.cmsband.withfig .cmsin{grid-template-columns:minmax(0,5fr) minmax(0,6fr)}}.cmsband .cmstx{display:grid;gap:18px;max-width:46ch}.cmsband .cmsfig{margin:0;aspect-ratio:4/5;overflow:hidden}.cmsband .cmsfig img{width:100%;height:100%;object-fit:cover}.annbar{position:fixed;z-index:60;left:50%;bottom:16px;transform:translateX(-50%);display:flex;gap:14px;padding:10px 20px;border-radius:999px;background:rgba(14,14,14,.92);color:#f4f1ea;font-size:.84rem}.annbar a{color:inherit}`;
const BADGE = `<div style="position:fixed;z-index:2147483647;top:10px;left:50%;transform:translateX(-50%);background:#8a6d3b;color:#fff;font:600 12px/1 system-ui;letter-spacing:.08em;padding:8px 14px;border-radius:999px;pointer-events:none">PREVIEW · NOT LIVE</div>`;

/* the frame's document: the page, its base address, the preview mark */
export function frameDoc(html, { scrollTo } = {}) {
  const base = `<base href="${SITE.replace(/"/g, "")}">`;
  html = html.replace(/<head>/i, `<head>\n${base}\n<meta name="robots" content="noindex,nofollow"><style>${EXTRA_CSS}</style>`);
  /* the intro is skipped; the page opens where the change is */
  const boot = `<script>try{localStorage.setItem("silavu-seen","1");localStorage.setItem("silavu-staff","1")}catch(e){}${scrollTo ? `addEventListener("load",function(){setTimeout(function(){var e=document.querySelector(${JSON.stringify(scrollTo)});if(e)e.scrollIntoView({block:"center"});},900)});` : ""}</script>`;
  return html.replace(/<\/body>/i, BADGE + "</body>").replace(/<head>/i, "<head>" + boot);
}

/* page text: the draft overrides, laid over the live page. Keys are made from
   the original wording; the live page carries the published wording, so each
   key is found again by what it says now. */
export function overStrings(liveHtml, inventory, published, draft) {
  const liveInv = stringInventory(liveHtml), byKey = {};
  const idx = {};
  for (const it of inventory) {
    const pub = published[it.key], now = pub && pub.en ? pub.en : it.en;
    const k = `${it.section}.${it.tag}.${fnv(toInline(now))}`; idx[k] = (idx[k] || 0) + 1;
    byKey[it.key] = idx[k] > 1 ? k + "~" + idx[k] : k;
  }
  const map = {};
  for (const it of inventory) {
    const d = draft[it.key], p = published[it.key];
    if (JSON.stringify(d || null) === JSON.stringify(p || null)) continue;
    const target = d || { en: it.en, he: it.he, href: it.href };
    if (liveInv.some(x => x.key === byKey[it.key])) map[byKey[it.key]] = target;
  }
  return applyStrings(liveHtml, map);
}

export async function previewHome({ lang = "en", inventory, strings, home, settings, configurator, nav, piece, scrollTo }) {
  let html = await live(lang === "he" ? "he/" : "");
  const notes = [];
  if (strings) html = overStrings(html, inventory, strings.published || {}, strings.draft || {});
  if (home) {
    html = html.replace(/<section class="cmsband[\s\S]*?<\/section>/g, "");
    for (const [id, v] of Object.entries(home.sections || {})) if (!v.hidden && !html.includes(`<section id="${id}"`)) notes.push(id);
    html = applySections(html, home);
  }
  if (nav) html = applyNav(html, nav);
  if (configurator) html = applyConfigurator(html, configurator);
  if (settings) { html = html.replace(/<div class="annbar"[\s\S]*?<\/script>/, ""); html = applySettings(html, settings); }
  if (piece) {
    const p = JSON.parse(JSON.stringify(piece)), pw = priceWords(p.price);
    p.shots = (p.shots || []).map(s => ({ ...s, img: String(s.img || "").replace(/^media:/, "m-"), alt: s.alt || { en: "", he: "" } }));
    if (p.shots.some(s => s.img.startsWith("m-")) && !p.widths) p.widths = [640, 900, 1254];
    if (p.meta && p.meta.length) p.meta[p.meta.length - 1] = pw;
    if (p.specs) p.specs = p.specs.map(r => r[0] && r[0].en === "Price" ? [r[0], pw] : r);
    let card = pieceCard(p).replace(/(src|srcset)="\/img\//g, '$1="img/').replace(/, \/img\//g, ", img/");
    if (lang === "he") card = card.replace(/(<[^>]*\sdata-he="([^"]*)"[^>]*>)([^<]*)(<\/)/g, (m, open, he, txt, close) => open + he.replace(/&quot;/g, '"') + close);
    const re = new RegExp(`<article class="piece" id="p-${p.id}"[\\s\\S]*?<\\/article>`);
    html = re.test(html) ? html.replace(re, card) : html.replace('<div class="pgrid">', '<div class="pgrid">' + card);
  }
  html = await swapLibraryImages(html);
  return { html: frameDoc(html, { scrollTo: scrollTo || (piece ? "#p-" + piece.id : null) }), notes };
}

export async function previewDocument(kind, d, lang = "en") {
  /* any live document page is the frame: header, footer, styles */
  let html = await live(lang === "he" ? "privacy/?lang=he" : "privacy/");
  const main = kind === "policy" ? policyMain(d) : docpageMain(d, (n, w) => `img/${n}-${w}.jpg`);
  html = html.replace(/<main class="doc">[\s\S]*?<\/main>/, main);
  html = await swapLibraryImages(html);
  return frameDoc(html);
}

export { blockHtml };
