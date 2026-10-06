/* What the build renders: the published release if there is one, else the
   seed (the site as it was before the admin existed).

   The release file is written by the Pages workflow before the build, from
   the backend (or, if the backend cannot be reached, from the copy the live
   site already serves at /_content/release.json). A document in the release
   replaces the seed's; a key the release lists as archived is dropped even if
   the seed still has it. A document that fails its basic shape check is
   ignored in favour of the seed's, with a warning, so one bad record can
   never take the site down. */
import fs from "node:fs";
import { seedDocs } from "./seed.mjs";
import { priceWords } from "./money.mjs";
import { safeDeep } from "./apply.mjs";

const ROOT = new URL("../../", import.meta.url).pathname;           // lumera/site/
const FILE = process.env.SILAVU_RELEASE || ROOT + "content/release.json";

const ok = {
  product: d => d && d.id && d.name && d.name.en && d.name.he && Array.isArray(d.shots) && d.shots.length && d.line && Array.isArray(d.specs) && Array.isArray(d.meta),
  policy: d => d && d.slug && d.title && Array.isArray(d.body),
  about: d => d && d.slug && d.title && Array.isArray(d.letter),
  docpage: d => d && d.slug && d.title && d.title.en && Array.isArray(d.blocks),
  configurator: d => d && Array.isArray(d.cuts) && d.cuts.some(c => c.enabled !== false) && d.carat && d.pricing
};

function load() {
  const seed = seedDocs();
  let docs = { ...seed }, info = { source: "seed", release: null, generated_at: null, warnings: [] };
  if (fs.existsSync(FILE)) {
    try {
      const r = JSON.parse(fs.readFileSync(FILE, "utf8"));
      const snap = r.snapshot || r;
      if (snap.schema !== 1 || !snap.docs) throw new Error("unknown release format");
      for (const k of snap.archived || []) delete docs[k];
      for (const [k, v] of Object.entries(snap.docs)) {
        const check = ok[v.kind];
        if (check && !check(v.data)) { info.warnings.push(`${k}: incomplete in the release, the previous version is used`); continue; }
        docs[k] = { kind: v.kind, title: k, sort: v.sort ?? 0, data: v.data, rev: v.rev };
      }
      info = { ...info, source: "release", release: r.release ?? null, generated_at: snap.generated_at || null };
    } catch (e) {
      info.warnings.push("release.json could not be read (" + e.message + "); the seed is used");
    }
  }
  for (const w of info.warnings) console.warn("content:", w);
  return { docs, info, seed };
}

const { docs, info, seed } = load();
export const CONTENT_INFO = info;
export const DOCS = docs;

const ofKind = (kind) => Object.entries(docs).filter(([, d]) => d.kind === kind).sort((a, b) => (a[1].sort - b[1].sort) || a[0].localeCompare(b[0]));
const one = (key) => (docs[key] || seed[key]).data;

/* a photograph from the library is written by the build as img/m-<id>-<w>.jpg */
const imgName = (img) => /^media:[0-9a-f-]{36}$/.test(img) ? "m-" + img.slice(6) : img;
const LIGHT_WIDTHS = [640, 900, 1254];

function piece(d) {
  const p = safeDeep(d);
  const usesLibrary = p.shots.some(s => /^media:/.test(s.img));
  p.shots = p.shots.map(s => ({ ...s, img: imgName(s.img), alt: s.alt || { en: "", he: "" } }));
  if (usesLibrary && !p.widths) p.widths = LIGHT_WIDTHS;
  if (p.film && p.film.media) p.film = { ...p.film, src: "v/m-" + p.film.media.replace(/^media:/, "") };
  /* the price is said in one place and shown wherever the piece shows it */
  const pw = priceWords(p.price);
  if (Array.isArray(p.meta) && p.meta.length) p.meta[p.meta.length - 1] = pw;
  if (Array.isArray(p.specs)) p.specs = p.specs.map(r => (r[0] && r[0].en === "Price") ? [r[0], pw] : r);
  return p;
}

export const PIECES = ofKind("product").map(([, d]) => d.data).filter(p => p.status !== "hidden").map(piece);
const col = one("collections");
export const CATS = safeDeep(col.cats);
export const SOON = safeDeep(col.soon || []);
/* Words in a policy that must match how the site is set up. A policy can say
   {{enquiry_delivery}} or {{site_collects}}; the build writes in the sentence
   that is true for this build: where an enquiry goes, and what is counted. */
const FN = /^https:\/\/[^\s"<>]+$/.test(process.env.SILAVU_FUNCTIONS_URL || "") ? process.env.SILAVU_FUNCTIONS_URL.replace(/\/+$/, "") : "";
export const FUNCTIONS_URL = FN;
const ANALYTICS_MODE = FN ? ((one("settings").analytics || {}).mode || "consent") : "off";
const TRUTH = {
  enquiry_delivery: FN
    ? { en: "When you press send, what you wrote is saved in the house's own records, kept for SILAVU by Supabase (a database service), and the concierge is told by email. If you left an email address, a confirmation may be sent to it. Nothing else is sent with it.",
        he: "כשאתם לוחצים על שליחה, מה שכתבתם נשמר ברשומות של הבית, המאוחסנות עבור SILAVU אצל Supabase (שירות מסדי נתונים), והקונסיירז׳ מקבל הודעה באימייל. אם השארתם כתובת אימייל, ייתכן שיישלח אליה אישור. דבר נוסף אינו נשלח יחד איתו." }
    : { en: "When you press send, the enquiry form delivers what you wrote to the concierge's inbox through FormSubmit (formsubmit.co), a form-delivery service, which also emails you a confirmation if you left an email address. Nothing else is sent with it.",
        he: "כשאתם לוחצים על שליחה, טופס הפנייה מעביר את מה שכתבתם לתיבת הדואר של הקונסיירז׳ באמצעות FormSubmit ‏(formsubmit.co), שירות להעברת טפסים, שגם שולח לכם אישור אם השארתם כתובת אימייל. דבר נוסף אינו נשלח יחד איתו." },
  site_collects: ANALYTICS_MODE === "consent"
    ? { en: "No advertising trackers, no third-party analytics, no profile, no cookies. If you allow it, the site counts your visit anonymously on the house's own systems: the pages and pieces you looked at, the site you came from, your kind of device and your language, and a random number kept in your browser so that a return visit can be told from a new one. Nothing you type is counted. You can change your answer at any time from \"Analytics choices\" at the foot of every page. Your language choice is kept in your own browser and never leaves it.",
        he: "אין באתר רכיבי מעקב פרסומיים, אין כלי ניתוח של צד שלישי, אין פרופיל ואין עוגיות. אם תאשרו, האתר סופר את הביקור שלכם באופן אנונימי במערכות של הבית: הדפים והתכשיטים שראיתם, האתר שממנו הגעתם, סוג המכשיר והשפה, ומספר אקראי שנשמר בדפדפן כדי להבחין בין ביקור חוזר לביקור חדש. שום דבר שאתם מקלידים אינו נספר. אפשר לשנות את התשובה בכל עת דרך \"בחירות מדידה\" בתחתית כל דף. בחירת השפה נשמרת בדפדפן שלכם בלבד." }
    : ANALYTICS_MODE === "cookieless"
    ? { en: "No advertising trackers, no third-party analytics, no profile, no cookies. The site counts visits anonymously on the house's own systems: the pages and pieces looked at, the site a visit came from, the kind of device and the language. Nothing is stored on your device for this unless you allow it, which lets a return visit be told from a new one. Nothing you type is counted. You can say no at any time from \"Analytics choices\" at the foot of every page. Your language choice is kept in your own browser and never leaves it.",
        he: "אין באתר רכיבי מעקב פרסומיים, אין כלי ניתוח של צד שלישי, אין פרופיל ואין עוגיות. האתר סופר ביקורים באופן אנונימי במערכות של הבית: הדפים והתכשיטים שנצפו, האתר שממנו הגיע הביקור, סוג המכשיר והשפה. דבר אינו נשמר במכשיר שלכם לשם כך אלא אם תאשרו, וכך אפשר להבחין בין ביקור חוזר לחדש. שום דבר שאתם מקלידים אינו נספר. אפשר לסרב בכל עת דרך \"בחירות מדידה\" בתחתית כל דף. בחירת השפה נשמרת בדפדפן שלכם בלבד." }
    : { en: "No advertising trackers, no third-party analytics, no profile. The site sets no cookie for marketing. Your language choice is kept in your own browser and never leaves it.",
        he: "אין באתר רכיבי מעקב פרסומיים, אין כלי ניתוח של צד שלישי ואין פרופיל משתמש. האתר אינו שומר עוגיות שיווקיות. בחירת השפה נשמרת בדפדפן שלכם בלבד." }
};
/* a pair { en, he } gets each language's sentence; anything else is walked */
const truth = (o) => {
  if (Array.isArray(o)) return o.map(truth);
  if (!o || typeof o !== "object") return o;
  const out = {};
  for (const [k, v] of Object.entries(o)) out[k] = (k === "en" || k === "he") && typeof v === "string"
    ? v.replace(/\{\{(\w+)\}\}/g, (m, t) => TRUTH[t] ? TRUTH[t][k] : m) : truth(v);
  return out;
};
export const ANALYTICS = ANALYTICS_MODE;
export const POLICIES = ofKind("policy").map(([, d]) => truth(safeDeep(d.data)));
export const ABOUT = safeDeep(one("about"));
export const DOCPAGES = ofKind("docpage").map(([, d]) => d.data).filter(p => p.status !== "hidden");   // plain text, escaped when written
/* the documents listed under "Client care": the policies, then any page the owner added there */
export const FOOTER_DOCS = [...POLICIES.map(d => ({ slug: d.slug, title: d.title })), ...DOCPAGES.filter(d => d.footer !== false).map(d => ({ slug: d.slug, title: d.title }))];
export const CONFIGURATOR = one("configurator");
/* the database keeps object keys in its own order; written into the page,
   the figures keep the seed's order, so the same content is the same bytes */
const likeSeed = (v, ref) => {
  if (!v || typeof v !== "object" || Array.isArray(v) || !ref || typeof ref !== "object") return v;
  const keys = [...Object.keys(ref).filter(k => k in v), ...Object.keys(v).filter(k => !(k in ref))];
  return Object.fromEntries(keys.map(k => [k, likeSeed(v[k], ref[k])]));
};
export const PRICING = likeSeed(CONFIGURATOR.pricing, (seedDocs().configurator || {}).data?.pricing);
export const SETTINGS = one("settings");
export const HOME = one("page:home");
export const STRINGS = (one("strings").overrides) || {};
export const TRANSLATIONS = one("translations");
export const NAV = one("navigation");
/* moved pages: GitHub Pages cannot answer with a redirect, so the old address
   gets a small page that sends the reader on and tells search engines where
   the page lives now */
export const REDIRECTS = ((NAV && NAV.redirects) || []).filter(r => r && /^[a-z0-9][a-z0-9/_-]*\/$/.test(r.from || "") && /^([a-z0-9][a-z0-9/_-]*\/)?$/.test(r.to || ""));
/* titles and descriptions go into the head and into attributes: no markup, no quotes */
const plainDeep = (o) => typeof o === "string" ? o.replace(/<[^>]*>/g, "").replace(/["<>]/g, "") : Array.isArray(o) ? o.map(plainDeep) : o && typeof o === "object" ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, plainDeep(v)])) : o;
export const SEO = plainDeep(one("seo"));

/* the public copy of what was built, served at /_content/release.json: the
   next build falls back to it if the backend cannot be reached. Everything
   in it is already on the public site. */
export function publicRelease() {
  const out = { schema: 1, generated_at: info.generated_at, docs: {}, archived: Object.keys(seed).filter(k => !docs[k]) };
  for (const [k, d] of Object.entries(docs)) out.docs[k] = { kind: d.kind, sort: d.sort, rev: d.rev ?? null, data: d.data };
  return { release: info.release, source: info.source, snapshot: out };
}
