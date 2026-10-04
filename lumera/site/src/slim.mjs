/* Makes the page lighter before it is written, without changing what it does.

   1. Rules nobody can match are dropped. The stylesheet has grown in layers
      over many passes, and a good part of it styles things that are no longer
      on any page: a class or id that appears nowhere in the markup, the
      scripts, the static generator or the content files cannot be put on an
      element, so a selector that needs one can never apply. A selector is
      kept if every class and id it requires is found somewhere in that text;
      what sits inside :not(), :is(),
      :where() or :has() is not required. Keyframes and @font-face are
      left alone. This only removes; it never rewrites a rule.
   2. The stylesheet is minified (cssnano-simple) and each script is minified
      (terser, top-level names kept, so the scripts still meet each other on
      window exactly as before).

   Both tools come from the local node_modules. If they are missing the page
   is written as it was, with a warning, rather than not at all. */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
function tryReq(n) { try { return require(n); } catch (e) { return null; } }
const postcss = tryReq("postcss") || tryReq("../../node_modules/postcss");
const cssnano = tryReq("next/dist/compiled/cssnano-simple") || tryReq("../../node_modules/next/dist/compiled/cssnano-simple");
const terser = tryReq("next/dist/compiled/terser") || tryReq("../../node_modules/next/dist/compiled/terser");

function corpusWords(texts) {
  const set = new Set();
  for (const t of texts) for (const w of t.match(/[A-Za-z_][\w-]*/g) || []) set.add(w);
  return set;
}
function needs(sel) {
  /* what a selector requires to exist: its classes and ids, outside :not(),
     :is(), :where() and :has(); a list inside :is() asks for any one of its
     members, not all of them, so nothing in it is counted as required */
  let s = sel, prev;
  do { prev = s; s = s.replace(/:(?:not|is|where|has|matches)\((?:[^()]|\([^()]*\))*\)/g, ""); } while (s !== prev);
  s = s.replace(/\[[^\]]*\]/g, "").replace(/"[^"]*"|'[^']*'/g, "");
  return (s.match(/[.#][A-Za-z_][\w-]*/g) || []).map(t => t.slice(1));
}
function purgePlugin(words, stats) {
  return {
    postcssPlugin: "silavu-purge-dead",
    Rule(rule) {
      let p = rule.parent; while (p) { if (p.type === "atrule" && /keyframes$/i.test(p.name)) return; p = p.parent; }
      const keep = rule.selectors.filter(sel => needs(sel).every(t => words.has(t)));
      if (keep.length === rule.selectors.length) return;
      stats.sel += rule.selectors.length - keep.length;
      if (stats.log) rule.selectors.filter(x => !keep.includes(x)).forEach(x => stats.log.push(x + "   <- " + needs(x).filter(t => !words.has(t)).join(",")));
      if (!keep.length) { stats.rules++; rule.remove(); } else rule.selectors = keep;
    },
    AtRuleExit: { media(at) { if (!at.nodes || !at.nodes.length) at.remove(); }, supports(at) { if (!at.nodes || !at.nodes.length) at.remove(); } }
  };
}
purgePlugin.postcss = true;

export async function slim(page, extraFiles) {
  const before = page.length;
  if (!postcss || !cssnano || !terser) { console.warn("slim: postcss/cssnano/terser not found; page written unminified"); return page; }
  const SITE = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  const texts = [page.replace(/<style>[\s\S]*?<\/style>/, "")];
  for (const f of extraFiles) { try { texts.push(fs.readFileSync(path.resolve(SITE, f), "utf8")); } catch (e) {} }
  const words = corpusWords(texts);
  const stats = { rules: 0, sel: 0, log: process.env.SLIM_LOG ? [] : null };
  /* the stylesheet */
  const m = page.match(/<style>([\s\S]*?)<\/style>/);
  if (m) {
    const plugins = [];
    if (!process.env.NO_PURGE) plugins.push(purgePlugin(words, stats));
    if (!process.env.NO_NANO) plugins.push(cssnano());
    const out = await postcss(plugins).process(m[1], { from: undefined });
    page = page.replace(m[0], () => "<style>" + out.css + "</style>");
    if (stats.log) fs.writeFileSync(process.env.SLIM_LOG, stats.log.join("\n"));
    console.log("slim: css", (m[1].length / 1024).toFixed(0), "KB ->", (out.css.length / 1024).toFixed(0), "KB;", stats.rules, "dead rules and", stats.sel, "dead selectors dropped");
  }
  /* the scripts, one at a time; JSON and anything that will not parse is left as it is */
  const parts = []; let at = 0; const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/g; let sm;
  while ((sm = re.exec(page))) {
    parts.push(page.slice(at, sm.index)); at = re.lastIndex;
    const attrs = sm[1] || "", code = sm[2];
    if (/application\/ld\+json/.test(attrs) || code.trim().length < 200) { parts.push(sm[0]); continue; }
    try {
      const r = await terser.minify(code, { compress: { passes: 1 }, mangle: true, toplevel: false, format: { comments: false } });
      parts.push("<script" + attrs + ">" + r.code + "</script>");
    } catch (e) { console.warn("slim: a script was left unminified:", String(e.message || e).slice(0, 120)); parts.push(sm[0]); }
  }
  parts.push(page.slice(at)); page = parts.join("");
  console.log("slim: page", (before / 1024).toFixed(0), "KB ->", (page.length / 1024).toFixed(0), "KB");
  return page;
}
