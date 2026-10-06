/* Applying published content to the page's markup. Pure string functions,
   no Node APIs: the build runs them on the body before it is written, and
   the admin runs the same ones on the live page for its preview, so what is
   previewed is what will be built.

   Page text. Every element with data-en / data-he is a string the reader can
   switch language on. Each gets a stable key: the chapter it sits in, its
   tag, and a hash of its original English (plus ~2, ~3 for repeats in the
   same chapter). An override { en, he, href?, hidden? } replaces both
   languages, the visible text when it is exactly the original, a link's
   destination, or removes a link. Text is stored as plain text with *these*
   marking emphasis (the only markup the page's copy uses) and is escaped on
   the way in, so an override can never carry a script or an attribute. */

export const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, "0"); };
const unA = (v) => v.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const escAttr = (v) => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escText = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* *emphasis* and line breaks; everything else is text */
export const toInline = (t) => escText(String(t ?? "")).replace(/\*([^*\n]+)\*/g, "<em>$1</em>").replace(/\n/g, "<br>");
export const fromInline = (h) => unA(String(h ?? "").replace(/<em>([\s\S]*?)<\/em>/g, "*$1*").replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, ""));

/* Text that the page writes as markup (product names, stories, policies,
   About): the few tags the house's copy uses are kept, everything else that
   looks like a tag is written out as text. Never an attribute but the one
   class the About page uses. */
const KEEP = { em: 1, strong: 1, b: 1, i: 1, br: 1, bdi: 1, span: 1 };
export function safeInline(html) {
  return String(html ?? "").replace(/<(\/?)([a-zA-Z][\w-]*)([^<>]*)>/g, (m, close, tag, attrs) => {
    const t = tag.toLowerCase();
    if (!KEEP[t]) return m.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    if (close) return `</${t}>`;
    if (t === "span" && /^\s*class="ajc"\s*$/.test(attrs)) return '<span class="ajc">';
    return `<${t}>`;
  }).replace(/<(?![a-zA-Z/])/g, "&lt;");
}
/* every string in a content object, made safe */
export function safeDeep(o) {
  if (typeof o === "string") return safeInline(o);
  if (Array.isArray(o)) return o.map(safeDeep);
  if (o && typeof o === "object") { const out = {}; for (const [k, v] of Object.entries(o)) out[k] = safeDeep(v); return out; }
  return o;
}

const SAFE_HREF = /^(#[\w-]*|(?:\.\.?\/|\/)?[\w\-./]*\/?(?:[?#][\w\-=&%.]*)?|https:\/\/[^\s"'<>]+|mailto:[^\s"'<>]+|tel:\+?[\d\s-]+)$/;
export const safeHref = (h) => typeof h === "string" && SAFE_HREF.test(h.trim()) && !/^\s*javascript:/i.test(h) ? h.trim() : null;

/* the top-level chapters, and the stretches that belong to the products, the
   collection filter and the configurator (edited elsewhere in the admin) */
function regions(html) {
  const secs = [];
  const re = /<section\b[^>]*\bid="([\w-]+)"[^>]*>/g; let m;
  while ((m = re.exec(html))) {
    let depth = 1, i = re.lastIndex; const tag = /<(\/?)section\b[^>]*>/g; tag.lastIndex = i; let t;
    while (depth && (t = tag.exec(html))) depth += t[1] ? -1 : 1;
    secs.push({ id: m[1], from: m.index, to: t ? tag.lastIndex : html.length });
    re.lastIndex = t ? tag.lastIndex : html.length;
  }
  const skip = [];
  const g = html.indexOf('<div class="pgrid">'); if (g >= 0) { const e = html.indexOf("</article></div>", g); skip.push([g, e > 0 ? e : g]); }
  const c = html.indexOf('<div class="cats k"'); if (c >= 0) skip.push([c, html.indexOf("</div>", c)]);
  /* the documents' own titles in the footer are edited with the documents */
  const t = html.indexOf('<div class="ftrust'); if (t >= 0) skip.push([t, html.indexOf("</div>", t)]);
  return { secs, skip };
}

/* every string the page shows, with its key: the admin lists these */
export function stringInventory(html) {
  const { secs, skip } = regions(html), out = [], seen = {};
  const re = /<([a-zA-Z][\w-]*)\b([^>]*?\sdata-en="([^"]*)"[^>]*)>/g; let m;
  while ((m = re.exec(html))) {
    const at = m.index, attrs = m[2];
    if (skip.some(([a, b]) => at >= a && at <= b) || /\sdata-k="/.test(attrs)) continue;
    const he = (attrs.match(/\sdata-he="([^"]*)"/) || [])[1]; if (he == null) continue;
    const sec = (secs.find(s => at >= s.from && at < s.to) || { id: "chrome" }).id;
    const tag = m[1].toLowerCase(), en = unA(m[3]);
    let key = `${sec}.${tag}.${fnv(en)}`; seen[key] = (seen[key] || 0) + 1; if (seen[key] > 1) key += "~" + seen[key];
    const after = html.slice(re.lastIndex, re.lastIndex + en.length + tag.length + 3);
    const href = tag === "a" ? ((attrs.match(/\shref="([^"]*)"/) || [])[1] ?? null) : null;
    out.push({ key, section: sec, tag, en: fromInline(en), he: fromInline(unA(he)), href, inner: after === en + "</" + tag + ">", at });
  }
  return out;
}

export function applyStrings(html, overrides) {
  const keys = Object.keys(overrides || {}); if (!keys.length) return html;
  const inv = stringInventory(html).filter(s => overrides[s.key]).sort((a, b) => b.at - a.at);  // from the end, so positions hold
  for (const s of inv) {
    const o = overrides[s.key];
    const open = html.indexOf(">", s.at) + 1; let tagHtml = html.slice(s.at, open);
    const closeTag = "</" + s.tag + ">";
    const origEn = tagHtml.match(/\sdata-en="([^"]*)"/)[1];
    if (o.hidden && s.tag === "a") {
      const end = html.indexOf(closeTag, open); if (end > 0) { html = html.slice(0, s.at) + html.slice(end + closeTag.length); continue; }
    }
    const en = o.en != null && o.en !== "" ? toInline(o.en) : null, he = o.he != null && o.he !== "" ? toInline(o.he) : null;
    if (en != null) tagHtml = tagHtml.replace(/\sdata-en="[^"]*"/, ` data-en="${escAttr(en)}"`);
    if (he != null) tagHtml = tagHtml.replace(/\sdata-he="[^"]*"/, ` data-he="${escAttr(he)}"`);
    const h = o.href != null && s.tag === "a" ? safeHref(o.href) : null;
    if (h) tagHtml = tagHtml.replace(/\shref="[^"]*"/, ` href="${escAttr(h)}"`);
    let rest = html.slice(open);
    if (en != null && s.inner && rest.startsWith(unA(origEn) + closeTag)) rest = en + rest.slice(unA(origEn).length);
    html = html.slice(0, s.at) + tagHtml + rest;
  }
  return html;
}

/* ── chapters of the home page ─────────────────────────────────────────── */
import { BLOCK_SLOTS } from "./sections.mjs";
export { BLOCK_SLOTS };
export function blockHtml(b) {
  const t = b.title || {}, p = b.text || {}, c = b.cta || {};
  const href = safeHref(c.href || "");
  const btn = href && c.label && c.label.en ? `<a class="btn" href="${escAttr(href)}" data-en="${escAttr(toInline(c.label.en))}" data-he="${escAttr(toInline(c.label.he || c.label.en))}">${toInline(c.label.en)}</a>` : "";
  const img = b.image ? `<figure class="cmsfig"><img src="img/${escAttr(b.image.replace(/^media:/, "m-"))}-900.jpg" srcset="img/${escAttr(b.image.replace(/^media:/, "m-"))}-640.jpg 640w, img/${escAttr(b.image.replace(/^media:/, "m-"))}-900.jpg 900w, img/${escAttr(b.image.replace(/^media:/, "m-"))}-1254.jpg 1254w" sizes="(min-width:900px) 40vw, 92vw" alt="${escAttr((b.alt && b.alt.en) || "")}" data-alt-he="${escAttr((b.alt && b.alt.he) || "")}" loading="lazy" decoding="async"></figure>` : "";
  return `<section class="cmsband ${b.theme === "dark" ? "dark" : "light"}${b.image ? " withfig" : ""}" id="b-${escAttr(b.id)}" aria-label="${escAttr((t.en || "").replace(/\*/g, ""))}">
    <div class="wrap cmsin">${img}<div class="cmstx">${b.eyebrow && b.eyebrow.en ? `<div class="k gold" data-en="${escAttr(toInline(b.eyebrow.en))}" data-he="${escAttr(toInline(b.eyebrow.he || b.eyebrow.en))}">${toInline(b.eyebrow.en)}</div>` : ""}
    ${t.en ? `<h2 class="t h2" data-en="${escAttr(toInline(t.en))}" data-he="${escAttr(toInline(t.he || t.en))}">${toInline(t.en)}</h2>` : ""}
    ${p.en ? `<p class="p lead" data-en="${escAttr(toInline(p.en))}" data-he="${escAttr(toInline(p.he || p.en))}">${toInline(p.en)}</p>` : ""}${btn}</div></div></section>`;
}

export function applySections(html, home) {
  const cfg = (home && home.sections) || {}, hidden = Object.keys(cfg).filter(k => cfg[k] && cfg[k].hidden);
  const { secs } = regions(html);
  /* blocks first (they are placed after a chapter), then hidden chapters go */
  const blocks = ((home && home.blocks) || []).filter(b => !b.hidden && BLOCK_SLOTS.includes(b.after));
  for (const s of [...secs].sort((a, b) => b.from - a.from)) {
    const mine = blocks.filter(b => b.after === s.id);
    if (mine.length) html = html.slice(0, s.to) + "\n" + mine.map(blockHtml).join("\n") + html.slice(s.to);
  }
  for (const s of [...secs].sort((a, b) => b.from - a.from)) {
    if (!hidden.includes(s.id) || ["hero", "collection", "enquire", "end"].includes(s.id)) continue;
    html = html.slice(0, s.from) + `<!-- ${s.id}: hidden in the admin -->` + html.slice(s.to);
    /* and nothing on the page still points at it */
    html = html.replace(new RegExp(`<a\\b[^>]*\\shref="#${s.id}"[^>]*>[\\s\\S]*?<\\/a>`, "g"), "");
  }
  return html;
}

/* ── settings ──────────────────────────────────────────────────────────── */
export const HOUSE_EMAIL = "concierge@silavu.com";
export function applySettings(html, st) {
  const email = st && st.contact && /^[^\s@"<>]+@[^\s@"<>]+\.[^\s@"<>]{2,}$/.test(st.contact.email || "") ? st.contact.email : HOUSE_EMAIL;
  if (email !== HOUSE_EMAIL) html = html.split(HOUSE_EMAIL).join(escAttr(email));
  const inbox = st && st.enquiry && /^[^\s@"<>]+@[^\s@"<>]+\.[^\s@"<>]{2,}$/.test(st.enquiry.inbox || "") ? st.enquiry.inbox : "";
  const wa = String((st && st.contact && st.contact.whatsapp) || "").replace(/[^0-9]/g, "");
  const tel = String((st && st.contact && st.contact.phone) || "").replace(/[^0-9+]/g, "");
  /* https, or this machine's own address for a local rehearsal */
  const endpoint = st && st.enquiry && /^(https:\/\/|http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/)[^\s"<>]+$/.test(st.enquiry.endpoint || "") ? st.enquiry.endpoint : "";
  html = html.replace(/(<form id="cform"[^>]*?)\sdata-to="[^"]*"/, `$1 data-to="${escAttr(inbox)}"`)
             .replace(/(<form id="cform"[^>]*?)\sdata-wa="[^"]*"/, `$1 data-wa="${wa}"`)
             .replace(/(<form id="cform"[^>]*?)\sdata-tel="[^"]*"/, `$1 data-tel="${escAttr(tel)}"`)
             .replace(/(<form id="cform"[^>]*?)\sdata-endpoint="[^"]*"/, `$1 data-endpoint="${escAttr(endpoint)}"`);
  /* the try-on with the visitor's own photograph can be switched off */
  if (st && st.features && st.features.tryon === false) html = html.replace(/(<button\b[^>]*\sid="tryonBtn2")/, '$1 hidden style="display:none"');
  const a = st && st.announcement;
  if (a && a.enabled && a.text && a.text.en) {
    const h = safeHref(a.href || "");
    const inner = `<span data-en="${escAttr(toInline(a.text.en))}" data-he="${escAttr(toInline(a.text.he || a.text.en))}">${toInline(a.text.en)}</span>`;
    const id = fnv(a.text.en + "|" + (a.href || ""));
    const bar = `<div class="annbar" role="note" data-ann="${id}">${h ? `<a href="${escAttr(h)}">${inner}</a>` : inner}<button type="button" aria-label="Close" data-l-en="Close" data-l-he="סגירה">\u00d7</button></div>`
      + `<script>(function(){var b=document.querySelector(".annbar");if(!b)return;var k="silavu-ann-"+b.getAttribute("data-ann");try{if(localStorage.getItem(k))b.hidden=true;}catch(e){}b.querySelector("button").addEventListener("click",function(){b.hidden=true;try{localStorage.setItem(k,"1");}catch(e){}});})();</script>`;
    html = html.replace('<header class="sh" id="header">', bar + '\n<header class="sh" id="header">');
  }
  return html;
}

/* the socials list in the first script: a confirmed address is linked, an
   empty one is drawn unlinked, exactly as before */
export function applySocials(script, st) {
  const s = (st && st.socials) || {};
  for (const [name, key] of [["Instagram", "instagram"], ["TikTok", "tiktok"], ["YouTube", "youtube"], ["Pinterest", "pinterest"]]) {
    const url = /^https:\/\/[^\s"'<>\\]+$/.test(s[key] || "") ? s[key] : "";
    script = script.replace(new RegExp(`\\["${name}", "[^"]*"`), `["${name}", "${url}"`);
  }
  return script;
}

/* ── the configurator's offer ──────────────────────────────────────────── */
export function applyConfigurator(html, cfg) {
  if (!cfg) return html;
  const chip = (k, v) => new RegExp(`<button\\b[^>]*\\sdata-k="${k}" data-v="${v}"[^>]*>[\\s\\S]*?<\\/button>`);
  const def = cfg.defaults || {};
  for (const [k, list] of [["cut", cfg.cuts], ["origin", cfg.origins], ["metal", cfg.metals]]) {
    const live = (list || []).filter(x => x.enabled !== false);
    const d = live.some(x => x.id === def[k]) ? def[k] : (live[0] && live[0].id);
    for (const x of list || []) {
      html = html.replace(chip(k, x.id), (m) => {
        if (x.enabled === false) return "";
        let out = m.replace(/class="([^"]*?)\s*\bon\b([^"]*)"/, (q, a, b) => `class="${(a + b).trim()}"`);
        if (x.id === d) out = out.replace(/class="([^"]*)"/, (q, a) => `class="${a} on"`);
        if (x.en) out = out.replace(/(<span\b[^>]*?)\sdata-en="[^"]*" data-he="[^"]*">[^<]*<\/span>/, `$1 data-en="${escAttr(x.en)}" data-he="${escAttr(x.he || x.en)}">${escText(x.en)}</span>`)
                         .replace(/(<button\b[^>]*?)\sdata-en="[^"]*" data-he="[^"]*">[^<]*<\/button>$/, `$1 data-en="${escAttr(x.en)}" data-he="${escAttr(x.he || x.en)}">${escText(x.en)}</button>`);
        return out;
      });
    }
  }
  /* carat and wrist: the chips are the list */
  for (const [k, opts, unit, d] of [["ct", cfg.carat && cfg.carat.options, "ct", def.ct], ["wrist", cfg.wrists && cfg.wrists.options, "cm", def.wrist]]) {
    if (!Array.isArray(opts) || !opts.length) continue;
    const first = html.search(chip(k, "[^\"]+")); if (first < 0) continue;
    const all = html.match(new RegExp(chip(k, "[^\"]+").source, "g")) || [];
    const lastChip = all[all.length - 1], end = html.indexOf(lastChip, first) + lastChip.length;
    const dv = opts.includes(d) ? d : opts[0];
    const now = all.map(c => +c.match(/data-v="([^"]+)"/)[1]), onNow = all.findIndex(c => /class="[^"]*\bon\b/.test(c));
    if (now.join() === opts.map(Number).join() && now[onNow] === +dv) continue;   // unchanged: the markup is left exactly as it is
    const fresh = opts.map(v => `<button class="chip${v === dv ? " on" : ""}" data-k="${k}" data-v="${+v}">${+v} ${unit}</button>`).join("\n          ");
    html = html.slice(0, first) + fresh + html.slice(end);
  }
  return html;
}
export function configuratorDefaults(cfg) {
  const d = (cfg && cfg.defaults) || {}, live = (l) => (l || []).filter(x => x.enabled !== false).map(x => x.id);
  const pick = (v, l, f) => l.includes(v) ? v : (l[0] || f);
  const ct = cfg && cfg.carat && cfg.carat.options && cfg.carat.options.includes(d.ct) ? d.ct : (cfg && cfg.carat && cfg.carat.options && cfg.carat.options[0]) || 6;
  const wr = cfg && cfg.wrists && cfg.wrists.options && cfg.wrists.options.includes(d.wrist) ? d.wrist : (cfg && cfg.wrists && cfg.wrists.options && cfg.wrists.options[0]) || 17;
  return { origin: pick(d.origin, live(cfg && cfg.origins), "lab"), ct, metal: pick(d.metal, live(cfg && cfg.metals), "white"), wrist: wr, cut: pick(d.cut, live(cfg && cfg.cuts), "round") };
}

/* ── menus: links the owner adds ───────────────────────────────────────── */
export function applyNav(html, nav) {
  const extra = ((nav && nav.extra) || []).filter(x => x && x.label && x.label.en && safeHref(x.href || ""));
  const link = (x) => `<a href="${escAttr(safeHref(x.href))}" data-en="${escAttr(toInline(x.label.en))}" data-he="${escAttr(toInline(x.label.he || x.label.en))}">${toInline(x.label.en)}</a>`;
  const top = extra.filter(x => x.slot === "top").map(link).join("\n    ");
  if (top) html = html.replace(/(<nav id="topnav">[\s\S]*?)(\n\s*<\/nav>)/, `$1\n    ${top}$2`);
  const explore = extra.filter(x => x.slot === "footer").map(link).join("");
  if (explore) html = html.replace(/(<div class="fcol fexp rv">[\s\S]*?)(<\/div>\s*<div class="fcol fcon)/, `$1${explore}$2`);
  return html;
}

/* everything, in the order the build applies it */
export function applyAll(body, c) {
  let b = applySections(body, c.HOME);
  b = applyStrings(b, c.STRINGS);
  b = applyNav(b, c.NAV);
  b = applyConfigurator(b, c.CONFIGURATOR);
  b = applySettings(b, c.SETTINGS);
  return b;
}
