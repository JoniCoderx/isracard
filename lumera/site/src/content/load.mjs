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
  const p = JSON.parse(JSON.stringify(d));
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
export const CATS = col.cats;
export const SOON = col.soon || [];
export const POLICIES = ofKind("policy").map(([, d]) => d.data);
export const ABOUT = one("about");
export const DOCPAGES = ofKind("docpage").map(([, d]) => d.data).filter(p => p.status !== "hidden");
/* the documents listed under "Client care": the policies, then any page the owner added there */
export const FOOTER_DOCS = [...POLICIES.map(d => ({ slug: d.slug, title: d.title })), ...DOCPAGES.filter(d => d.footer !== false).map(d => ({ slug: d.slug, title: d.title }))];
export const CONFIGURATOR = one("configurator");
export const PRICING = CONFIGURATOR.pricing;
export const SETTINGS = one("settings");
export const HOME = one("page:home");
export const STRINGS = (one("strings").overrides) || {};
export const TRANSLATIONS = one("translations");
export const NAV = one("navigation");
export const SEO = one("seo");

/* the public copy of what was built, served at /_content/release.json: the
   next build falls back to it if the backend cannot be reached. Everything
   in it is already on the public site. */
export function publicRelease() {
  const out = { schema: 1, generated_at: info.generated_at, docs: {}, archived: Object.keys(seed).filter(k => !docs[k]) };
  for (const [k, d] of Object.entries(docs)) out.docs[k] = { kind: d.kind, sort: d.sort, rev: d.rev ?? null, data: d.data };
  return { release: info.release, source: info.source, snapshot: out };
}
