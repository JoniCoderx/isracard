// Turn silavu-page.html into a self-contained static index.html (for GitHub Pages or any static host).
// Usage: node gen-static.mjs <silavu-page.html> <out dir> [public base URL for OG tags]
import fs from "node:fs";
import path from "node:path";
import { PIECES } from "./src/pieces.mjs";
const [src, outDir, baseArg = "https://jonicoderx.github.io/isracard"] = process.argv.slice(2);
/* Canonical, og:url, og:image and the sitemap have to be absolute — a share
   scraper cannot resolve a relative image and a crawler cannot resolve a
   relative <loc>. A wrong third argument used to sail straight through and
   produce "/isracard//", which looks fine in a diff and is silently useless.
   A path is repaired against the host, the host is lower-cased because that
   is what GitHub Pages actually serves, and trailing slashes go. */
const ORIGIN = "https://jonicoderx.github.io";
let base = String(baseArg || "").trim().replace(/\/+$/, "");
if (!/^https?:\/\//i.test(base)) base = ORIGIN + "/" + base.replace(/^\/+/, "");
base = base.replace(/^(https?:\/\/)([^/]+)/i, (m, p, h) => p + h.toLowerCase()).replace(/\/+$/, "");
/* the social profiles live in one place, the page itself, so the ones the
   schema claims are the ones a reader can click */
const pageSrc = fs.readFileSync(src, "utf8");
const sameAs = [...new Set((pageSrc.match(/https:\/\/(?:www\.)?(?:instagram|tiktok|youtube|pinterest|facebook|linkedin|x)\.com\/[^"'\s\\]+/g) || []))].sort();
let html = fs.readFileSync(src, "utf8").replace(/<title>[\s\S]*?<\/title>/, "").replace(/<meta name="viewport"[^>]*>\s*/g, "").replace(/<meta charset=[^>]*>\s*/gi, "");
/* the font tags belong in the head, where the browser meets them before the
   half-megabyte of inline CSS; build.mjs writes them at the top of the page
   so the preview works on its own, and they are lifted out of the body here */
let fontLinks = "";
html = html.replace(/<link rel="preconnect" href="https:\/\/fonts\.[^>]*>\s*/g, "")
           .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, m => { fontLinks = m.trim(); return ""; });
/* every asset path becomes relative, so the page works under a sub-path such as /isracard/ */
html = html.replace(/(["'(=,\s])\/(img\/|f\/|v\/|icon-|favicon\.|og\.jpg|site\.webmanifest)/g, "$1$2");
const BUILD = (process.env.GITHUB_SHA || "dev").slice(0, 12);
/* What the tab and a search result say. Short, in the form the established
   houses use: the name, then what it is. The Hebrew page has its own. */
const TITLE = { en: "SILAVU | High Jewellery", he: "SILAVU | תכשיטי יוקרה" };
const DESC = {
  en: "Private high jewellery from Dubai and Tel Aviv. The SILAVU MOMENT bracelet, ICON ring and SOUL necklace, bespoke diamond commissions and private viewings by appointment.",
  he: "תכשיטי יוקרה מדובאי ותל אביב: צמיד SILAVU MOMENT, טבעת ICON ושרשרת SOUL, תכשיטי יהלומים בהתאמה אישית ופגישות פרטיות בתיאום מראש."
};
const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title data-en="${TITLE.en}" data-he="${TITLE.he}">${TITLE.en}</title>
<meta name="description" content="${DESC.en}">
<link rel="canonical" href="${base}/">
<meta name="theme-color" content="#000000">
<meta name="silavu-build" content="${BUILD}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<meta name="author" content="SILAVU">
<meta name="format-detection" content="telephone=no">
<link rel="alternate" hreflang="en" href="${base}/">
<link rel="alternate" hreflang="he" href="${base}/he/">
<link rel="alternate" hreflang="x-default" href="${base}/">
<meta property="og:locale" content="en_US">
<meta property="og:locale:alternate" content="he_IL">
<meta property="og:locale:alternate" content="fr_FR">
<meta property="og:locale:alternate" content="ar_AE">
<meta property="og:locale:alternate" content="ru_RU">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SILAVU">
<meta property="og:title" content="${TITLE.en}">
<meta property="og:description" content="${DESC.en}">
<meta property="og:image" content="${base}/og.jpg?v=7">
<meta property="og:image:secure_url" content="${base}/og.jpg?v=7">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The SILAVU mark in white on black, above the words Private high jewellery, Dubai and Tel Aviv">
<meta property="og:url" content="${base}/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${TITLE.en}">
<meta name="twitter:description" content="${DESC.en}">
<meta name="twitter:image" content="${base}/og.jpg?v=7">
<meta name="twitter:image:alt" content="The SILAVU mark in white on black, above the words Private high jewellery, Dubai and Tel Aviv">
<link rel="icon" href="favicon.ico?v=6" sizes="48x48 32x32 16x16">
<link rel="icon" href="icon-32.png?v=6" type="image/png" sizes="32x32">
<link rel="icon" href="icon-16.png?v=6" type="image/png" sizes="16x16">
<link rel="icon" href="favicon.svg?v=6" type="image/svg+xml" sizes="any">
<link rel="apple-touch-icon" href="icon-180.png?v=6" sizes="180x180">
<link rel="manifest" href="site.webmanifest?v=6">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fontLinks}
<link rel="preload" as="image" fetchpriority="high" media="(min-width: 900px)" href="img/hero-1600.jpg" imagesrcset="img/hero-1600.jpg 1600w, img/hero-2560.jpg 2560w, img/hero-3840.jpg 3840w" imagesizes="100vw">
<link rel="preload" as="image" fetchpriority="high" media="(max-width: 899px)" href="img/herov-1080.jpg" imagesrcset="img/herov-1080.jpg 1080w, img/herov-1440.jpg 1440w" imagesizes="100vw">
<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "JewelryStore"],
      "@id": base + "/#house",
      "name": "SILAVU",
      "alternateName": ["Silavu", "SILAVU Jewellery", "SILAVU High Jewellery"],
      "slogan": "High jewellery, made for one person.",
      "description": "A private high-jewellery house in Dubai and Tel Aviv. House collection, bespoke commissions and the SILAVU Line, by appointment.",
      "url": base + "/",
      "sameAs": sameAs,
      "address": [
        { "@type": "PostalAddress", "addressLocality": "Dubai", "addressCountry": "AE" },
        { "@type": "PostalAddress", "addressLocality": "Tel Aviv", "addressCountry": "IL" }
      ],
      "logo": base + "/icon-512.png",
      "image": base + "/og.jpg",
      "email": "concierge@silavu.com",
      "priceRange": "$$$$",
      "currenciesAccepted": "AED, ILS, USD, EUR",
      "knowsLanguage": ["en", "he", "fr", "ar", "ru"],
      "areaServed": [{ "@type": "Country", "name": "United Arab Emirates" }, { "@type": "Country", "name": "Israel" }],
      "location": [
        { "@type": "Place", "name": "SILAVU Dubai", "address": { "@type": "PostalAddress", "addressLocality": "Dubai", "addressCountry": "AE" } },
        { "@type": "Place", "name": "SILAVU Tel Aviv", "address": { "@type": "PostalAddress", "addressLocality": "Tel Aviv", "addressCountry": "IL" } }
      ],
      "makesOffer": { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Private viewing", "serviceType": "By appointment" } }
    },
    {
      "@type": "WebSite",
      "@id": base + "/#site",
      "url": base + "/",
      "name": "SILAVU",
      "inLanguage": ["en", "he", "fr", "ar", "ru"],
      "publisher": { "@id": base + "/#house" }
    },
    /* The collection, straight out of pieces.mjs. It used to be typed in here
       by hand and had drifted: it advertised three Monogram pieces and gave
       every one of them a price of zero, which is both untrue and the kind of
       thing a search engine holds against you. Now it cannot drift, and a
       piece quoted to its stones simply carries no price. */
    {
      "@type": "ItemList",
      "@id": base + "/#collection",
      "name": "The SILAVU Collection",
      "itemListOrder": "https://schema.org/ItemListOrderAscending",
      "numberOfItems": PIECES.filter(p => !p.exceptional).length,
      "itemListElement": PIECES.filter(p => !p.exceptional).map(function (p, i) {
        const plain = s => String(s).replace(/<[^>]+>/g, "");
        return {
          "@type": "ListItem", "position": i + 1,
          "item": {
            "@type": "Product",
            "@id": base + "/#" + p.id,
            "name": plain(p.name.en),
            "sku": p.ref.replace(/·/g, "-"),
            "description": plain(p.line.en) + (p.story ? " " + plain(p.story.en) : ""),
            "material": (p.specs.find(function (r) { return /Metal|Centre stone/.test(r[0].en); }) || [, { en: "" }])[1].en,
            "image": p.shots.map(function (sh) { return base + "/img/" + sh.img + "-" + p.widths[p.widths.length - 1] + ".jpg"; }).slice(0, 3),
            "brand": { "@id": base + "/#house" },
            "category": p.cat,
            "additionalProperty": p.specs.map(function (r) {
              return { "@type": "PropertyValue", "name": r[0].en, "value": plain(r[1].en) };
            }),
            "offers": {
              "@type": "Offer",
              "availability": "https://schema.org/MadeToOrder",
              "itemCondition": "https://schema.org/NewCondition",
              "availableAtOrFrom": { "@type": "Place", "name": "SILAVU Dubai" },
              "seller": { "@id": base + "/#house" },
              "description": "Price on request. Every piece is made to order and quoted personally."
            }
          }
        };
      })
    }
  ]
})}</script>
<script>window.__silavuBuild="${BUILD}";</script>
</head>
<body>
`;
const SRCDIR = path.dirname(path.resolve(src));
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "index.html"), head + html + "\n</body>\n</html>\n");

/* The Hebrew page. Same page, at its own address, so a search engine can find
   and show the Hebrew: the text is written into the markup here rather than
   swapped in by the script after load, the head speaks Hebrew, and both pages
   name each other. Every element that carries data-he gets that as its
   content, which is exactly what the script does when someone picks Hebrew. */
{
  const unA = v => v.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
  /* scripts, styles and SVG text are left exactly as they are */
  const masked = html.replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/gi, m => " ".repeat(m.length));
  const stack = [], cuts = [];
  const re = /<(\/?)([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  let m;
  while ((m = re.exec(masked))) {
    const close = m[1] === "/", name = m[2].toLowerCase(), attrs = m[3];
    if (!close) {
      if (VOID.has(name) || /\/\s*$/.test(attrs)) continue;
      const he = attrs.match(/\sdata-he="([^"]*)"/);
      stack.push({ name, from: re.lastIndex, he: he ? unA(he[1]) : null });
    } else {
      let i = stack.length - 1;
      while (i >= 0 && stack[i].name !== name) i--;
      if (i < 0) continue;
      const el = stack[i]; stack.length = i;
      if (el.he != null) cuts.push([el.from, m.index, el.he]);
    }
  }
  /* the outermost element wins: its new content replaces whatever was inside */
  cuts.sort((x, y) => x[0] - y[0] || y[1] - x[1]);
  let out = "", at = 0, end = -1;
  for (const [from, to, he] of cuts) {
    if (from < end) continue;
    out += html.slice(at, from) + he; at = to; end = to;
  }
  const heHtml = (out + html.slice(at)).replace(/alt="([^"]*)" data-alt-he="([^"]*)"/g, 'alt="$2" data-alt-en="$1" data-alt-he="$2"');
  const heHead = head
    .replace('<html lang="en">', '<html lang="he" dir="rtl" data-lang="he" data-ns="1">')
    .replace(/<head>\n/, '<head>\n<base href="../">\n')
    .replace(/<title[^>]*>[^<]*<\/title>/, m => m.replace(/>[^<]*</, ">" + TITLE.he + "<"))
    .replace(/(<meta name="description" content=")[^"]*/, "$1" + DESC.he)
    .replace(`<link rel="canonical" href="${base}/">`, `<link rel="canonical" href="${base}/he/">`)
    .replace('<meta property="og:locale" content="en_US">', '<meta property="og:locale" content="he_IL">')
    .replace('<meta property="og:locale:alternate" content="he_IL">', '<meta property="og:locale:alternate" content="en_US">')
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${base}/he/`)
    .replace(/(<meta property="og:title" content=")[^"]*/, "$1" + TITLE.he)
    .replace(/(<meta name="twitter:title" content=")[^"]*/, "$1" + TITLE.he)
    .replace(/(<meta property="og:description" content=")[^"]*/, "$1" + DESC.he)
    .replace(/(<meta name="twitter:description" content=")[^"]*/, "$1" + DESC.he)
    .replace('<script>window.__silavuBuild', '<script>window.__pageLang="he";window.__silavuBuild');
  fs.mkdirSync(path.join(outDir, "he"), { recursive: true });
  fs.writeFileSync(path.join(outDir, "he", "index.html"), heHead + heHtml + "\n</body>\n</html>\n");
  console.log("hebrew page:", cuts.length, "strings written in");
}
let POLICY_SLUGS = [];
const escA = v => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
fs.writeFileSync(path.join(outDir, ".nojekyll"), "");

/* The house documents. Real pages at real addresses rather than overlays on
   the one page: a reader who wants to know what happens to what they tell you
   should be able to link to the answer, and a crawler should be able to find
   it. They share the site's head so they share its type and its palette, and
   they carry nothing else — no header, no chapters, no bar. */
{
  const { POLICIES } = await import("./src/policies.mjs");
  POLICY_SLUGS = POLICIES.map(d => d.slug);
  const others = d => POLICIES.filter(o => o.slug !== d.slug)
    .map(o => `<a href="${o.slug}/" data-en="${escA(o.title.en)}" data-he="${escA(o.title.he)}">${o.title.en}</a>`).join("");
  for (const d of POLICIES) {
    const dir = path.join(outDir, d.slug);
    fs.mkdirSync(dir, { recursive: true });
    const dhead = head
      .replace(/<title[^>]*>[^<]*<\/title>/, `<title>${d.title.en} | SILAVU</title>`)
      .replace(/(<meta name="description" content=")[^"]*/, `$1${d.lede.en}`)
      .replace(base + "/", base + "/" + d.slug + "/")
      /* the site lives under a sub-path on Pages: every relative address in
         the shared head and in the documents resolves from the site root */
      .replace(/<head>\n/, `<head>\n<base href="../">\n`)
      /* the documents never show the opening photograph */
      .replace(/<link rel="preload" as="image"[^>]*>\n/g, "")
      .replace(/<link rel="alternate" hreflang[^>]*>\n/g, "")
      .replace(/(<meta property="og:url" content=")[^"]*/, `$1${base}/${d.slug}/`)
      .replace(/(<meta property="og:title" content=")[^"]*/, `$1${d.title.en} | SILAVU`)
      .replace(/(<meta property="og:description" content=")[^"]*/, `$1${d.lede.en}`)
      .replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${d.title.en} | SILAVU`)
      .replace(/(<meta name="twitter:description" content=")[^"]*/, `$1${d.lede.en}`);
    /* the documents get the site's own type and palette: the stylesheet lives
       in a <style> block inside the page body, not in the shared head */
    const styleBlock = (html.match(/<style>[\s\S]*?<\/style>/) || [""])[0];
    /* Every line carries its English and its Hebrew, and the page follows
       the language the reader chose on the site (kept in their browser):
       Hebrew is swapped in at once and the page turns right to left; French,
       Russian and Arabic come from the same dictionaries the site uses. */
    const A = x => `data-en="${escA(x.en)}" data-he="${escA(x.he)}"`;
    const body = styleBlock + `<main class="doc ivory">
<a class="back" href="./"><span class="bk" aria-hidden="true">←</span> SILAVU</a>
<h1 ${A(d.title)}>${d.title.en}</h1>
<p class="lede" ${A(d.lede)}>${d.lede.en}</p>
${d.body.map(([h, t]) => `<section><h2 ${A(h)}>${h.en}</h2><p ${A(t)}>${t.en}</p></section>`).join("\n")}
<div class="docfoot">${others(d)}</div>
</main>
<script>(function () {
  var l = "en"; try { l = localStorage.getItem("silavu-lang") || "en"; } catch (e) {}
  if (l === "en") return;
  var h = document.documentElement, rtl = l === "he" || l === "ar";
  function apply(dict) {
    h.lang = l; if (rtl) { h.dir = "rtl"; h.setAttribute("data-ns", "1"); }
    document.querySelectorAll("[data-en]").forEach(function (el) {
      var t = l === "he" ? el.getAttribute("data-he") : dict && dict[el.getAttribute("data-en")];
      if (t) el.textContent = t;
    });
    var t1 = document.querySelector("h1"); if (t1) document.title = t1.textContent + " | SILAVU";
  }
  if (l === "he") apply(null);
  else fetch("lang/" + l + ".json", { cache: "force-cache" }).then(function (r) { return r.json(); }).then(apply).catch(function () {});
})();</script>`;
    fs.writeFileSync(path.join(dir, "index.html"), dhead + body + "\n</body>\n</html>\n");
  }
  console.log("documents:", POLICIES.map(d => d.slug).join(" "));
}
/* the extra languages travel as data, fetched only when someone picks one */
{
  const from = path.join(SRCDIR, "lang");
  if (fs.existsSync(from)) {
    const to = path.join(outDir, "lang");
    fs.mkdirSync(to, { recursive: true });
    for (const f of fs.readdirSync(from)) if (f.endsWith(".json")) fs.copyFileSync(path.join(from, f), path.join(to, f));
    console.log("languages:", fs.readdirSync(to).join(" "));
  }
}
fs.writeFileSync(path.join(outDir, "robots.txt"),
  "User-agent: *\nAllow: /\n\nSitemap: " + base + "/sitemap.xml\n");
/* English and Hebrew each have an address and name each other. French,
   Russian and Arabic are switched inside the page and have none, so they are
   not claimed here. */
fs.writeFileSync(path.join(outDir, "sitemap.xml"),
  '<?xml version="1.0" encoding="UTF-8"?>\n'
  + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
  + ["/", "/he/"].map(u => "  <url>\n    <loc>" + base + u + "</loc>\n"
      + "    <xhtml:link rel=\"alternate\" hreflang=\"en\" href=\"" + base + "/\"/>\n"
      + "    <xhtml:link rel=\"alternate\" hreflang=\"he\" href=\"" + base + "/he/\"/>\n"
      + "    <xhtml:link rel=\"alternate\" hreflang=\"x-default\" href=\"" + base + "/\"/>\n"
      + "    <lastmod>" + new Date().toISOString().slice(0, 10) + "</lastmod>\n"
      + "    <changefreq>weekly</changefreq>\n    <priority>" + (u === "/" ? "1.0" : "0.9") + "</priority>\n  </url>\n").join("")
  + POLICY_SLUGS.map(sl => "  <url>\n    <loc>" + base + "/" + sl + "/</loc>\n"
      + "    <lastmod>" + new Date().toISOString().slice(0, 10) + "</lastmod>\n"
      + "    <changefreq>yearly</changefreq>\n    <priority>0.3</priority>\n  </url>\n").join("")
  + "</urlset>\n");
/* A custom domain is one file away. Drop the bought domain into
   lumera/site/CNAME and GitHub Pages serves the site from it; everything
   above then needs the origin passed to match, which the workflow does. */
const cnameSrc = path.join(path.dirname(src), "CNAME");
if (fs.existsSync(cnameSrc)) fs.copyFileSync(cnameSrc, path.join(outDir, "CNAME"));
console.log("static index written:", path.join(outDir, "index.html"), ((head.length + html.length) / 1024).toFixed(0) + " KB");
