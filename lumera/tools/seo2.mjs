// Static SEO audit of the generated site: every page's canonical, hreflang
// pairs that name each other, the sitemap, unique titles and descriptions,
// one H1, parseable structured data without invented prices or ratings, and
// every internal link resolving to a file.
import fs from "fs"; import path from "path";
const D = process.argv[2] || "/home/user/isracard/lumera/site/dist", BASE = process.argv[3] || "https://jonicoderx.github.io/isracard";
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
const pages = []; (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (!/^(img|f|v|assets|fonts|lang)$/.test(f)) walk(p); } else if (f === "index.html") pages.push(p); } })(D);
const info = pages.map(p => { const h = fs.readFileSync(p, "utf8"), rel = path.relative(D, path.dirname(p)).replace(/\\/g, "/"), url = BASE + "/" + (rel ? rel + "/" : "");
  return { p, rel, url, h, title: (/<title[^>]*>([^<]*)<\/title>/.exec(h) || [])[1], desc: (/<meta name="description" content="([^"]*)"/.exec(h) || [])[1], canon: (/<link rel="canonical" href="([^"]*)"/.exec(h) || [])[1],
    alts: [...h.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(m => [m[1], m[2]]), h1: (h.match(/<h1[\s>]/g) || []).length,
    ld: [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]), base: (/<base href="([^"]*)"/.exec(h) || [])[1] || "" }; });
console.log("pages:", info.length);
for (const x of info) {
  ok(x.canon === x.url, `${x.rel || "/"}: canonical ${x.canon === x.url ? "is itself" : x.canon}`);
  ok(x.h1 === 1, `${x.rel || "/"}: one H1 (${x.h1})`);
  ok(x.title && x.title.length >= 10 && x.title.length <= 70 && x.desc && x.desc.length >= 50 && x.desc.length <= 170, `${x.rel || "/"}: title ${x.title && x.title.length} chars, description ${x.desc && x.desc.length} chars`);
  let ldok = true, bad = ""; for (const j of x.ld) { try { const o = JSON.parse(j), s = JSON.stringify(o); if (/"(price|offers|aggregateRating|review|ratingValue)"/.test(s)) { ldok = false; bad = "invented commerce field"; } } catch (e) { ldok = false; bad = e.message; } }
  ok(ldok, `${x.rel || "/"}: structured data parses, no price/rating/review ${bad}`);
  for (const [lang, href] of x.alts) { const other = info.find(y => y.url === href); ok(!!other && (lang === "x-default" || other.alts.some(([l, h]) => h === x.url)), `${x.rel || "/"}: hreflang ${lang} → ${href.replace(BASE, "")} names it back`); }
}
const dupT = info.filter((x, i) => info.findIndex(y => y.title === x.title) !== i), dupD = info.filter((x, i) => info.findIndex(y => y.desc === x.desc) !== i);
ok(!dupT.length, `titles unique ${dupT.map(x => x.rel).join(",")}`); ok(!dupD.length, `descriptions unique ${dupD.map(x => x.rel).join(",")}`);
const sm = fs.readFileSync(path.join(D, "sitemap.xml"), "utf8"), locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const missing = locs.filter(u => !info.find(x => x.url === u)), unlisted = info.filter(x => !locs.includes(x.url));
ok(!missing.length, `sitemap: ${locs.length} addresses, every one is a page ${missing.join(" ")}`);
ok(!unlisted.length, `sitemap lists every page ${unlisted.map(x => x.rel).join(" ")}`);
ok(/Sitemap: /.test(fs.readFileSync(path.join(D, "robots.txt"), "utf8")), "robots.txt names the sitemap");
// internal links resolve
let broken = [];
for (const x of info) for (const m of x.h.matchAll(/<a [^>]*href="([^"#?]*)(?:[?#][^"]*)?"/g)) { const href = m[1]; if (!href || /^(https?:|mailto:|tel:|javascript:)/.test(href)) continue;
  const from = x.base ? path.resolve(path.dirname(x.p), x.base) : path.dirname(x.p); const t = path.resolve(href.startsWith("/") ? D : from, href.replace(/^\//, ""));
  const f = fs.existsSync(t) && fs.statSync(t).isDirectory() ? path.join(t, "index.html") : t; if (!fs.existsSync(f)) broken.push(`${x.rel || "/"} → ${href}`); }
ok(!broken.length, `internal links resolve (${broken.length} broken) ${[...new Set(broken)].slice(0, 6).join(" | ")}`);
console.log(`${pass} pass, ${fail} fail`);
