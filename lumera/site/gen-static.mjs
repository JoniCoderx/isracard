// Turn silavu-page.html into a self-contained static index.html (for GitHub Pages or any static host).
// Usage: node gen-static.mjs <silavu-page.html> <out dir> [public base URL for OG tags]
import fs from "node:fs";
import path from "node:path";
import { PIECES, POLICIES, ABOUT, DOCPAGES, FOOTER_DOCS, SEO, SETTINGS, TRANSLATIONS, CONTENT_INFO, FUNCTIONS_URL, ANALYTICS, REDIRECTS, publicRelease } from "./src/content/load.mjs";
import { toInline, safeHref, safeInline, HOUSE_EMAIL } from "./src/content/apply.mjs";
import { priceWords, baseCurrency } from "./src/content/money.mjs";
import { policyMain, docpageMain, aboutText, aboutCaption } from "./src/content/templates.mjs";
/* a piece with a set price carries an Offer; a piece quoted on request carries none */
const offerOf = (p, url) => { const pr = p.price || {}, cur = baseCurrency(pr);
  if (pr.mode !== "exact" || !cur) return undefined;
  return { "@type": "Offer", "url": url, "price": (pr.amounts[cur] / 100).toFixed(2), "priceCurrency": cur, "availability": "https://schema.org/MadeToOrder", "seller": { "@type": "Organization", "name": "SILAVU" } }; };
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
/* The address is set in one place. When the house's own domain is written
   into lumera/site/CNAME, it becomes the base for everything absolute — the
   canonical links, hreflang, og:url, the sitemap, robots.txt and the
   structured data — whatever the workflow passes, so a move to the domain is
   one file and one deploy rather than a search through the generator. */
{
  const cn = path.join(path.dirname(path.resolve(src)), "CNAME");
  if (fs.existsSync(cn)) { const d = fs.readFileSync(cn, "utf8").trim().split(/\s+/)[0]; if (d) base = "https://" + d.toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, ""); }
}
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
           .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, m => {
             /* the Arabic face is the only one fetched from outside, and only an
                Arabic page needs it: it no longer holds up the first paint of
                every page in every language (Lighthouse measured 600ms on a
                phone). It arrives in the background and swaps in. */
             const href = /href="([^"]+)"/.exec(m)[1];
             fontLinks = `<link rel="stylesheet" href="${href}" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="${href}"></noscript>`; return ""; });
/* every asset path becomes relative, so the page works under a sub-path such as /isracard/ */
html = html.replace(/(["'(=,\s])\/(img\/|f\/|v\/|icon-|favicon\.|og\.jpg|site\.webmanifest)/g, "$1$2");
/* The stylesheet and the large scripts leave the page and become files with
   their content's hash in the name. The home page, the Hebrew page and every
   document then share one cached copy instead of each carrying half a
   megabyte inline, and a returning reader downloads only what changed. The
   scripts keep their order and stay synchronous at the end of the body, so
   they run exactly as they did inline. */

const crypto = await import("node:crypto");
const ASSETS = path.join(outDir, "assets");
fs.rmSync(ASSETS, { recursive: true, force: true }); fs.mkdirSync(ASSETS, { recursive: true });
const hashOf = t => crypto.createHash("sha1").update(t).digest("hex").slice(0, 10);
let cssLink = "";
/* the two faces every page sets first, asked for before the stylesheet is read */
const fontPreload = ["jost-normal-latin"].map(k => { const f = fs.readdirSync(path.join(path.dirname(path.resolve(src)), "public/fonts")).find(x => x.startsWith(k + "-") && x.endsWith(".woff2"));
  return f ? `<link rel="preload" as="font" type="font/woff2" href="fonts/${f}" crossorigin>` : ""; }).filter(Boolean).join("\n");
html = html.replace(/<style>([\s\S]*?)<\/style>\s*/, (m0, css) => { css = css.replace(/url\(fonts\//g, "url(../fonts/"); const n = "silavu." + hashOf(css) + ".css"; fs.writeFileSync(path.join(ASSETS, n), css); cssLink = '<link rel="stylesheet" href="assets/' + n + '">'; return ""; });
let jsN = 0;
html = html.replace(/<script>([\s\S]*?)<\/script>/g, (m0, code) => {
  if (code.length < 4000) return m0;
  const n = "s" + (++jsN) + "." + hashOf(code) + ".js"; fs.writeFileSync(path.join(ASSETS, n), code);
  return '<script src="assets/' + n + '"></script>';
});
const BUILD = (process.env.GITHUB_SHA || "dev").slice(0, 12);
/* What the tab and a search result say. Short, in the form the established
   houses use: the name, then what it is. The Hebrew page has its own. */
const TITLE = SEO.home.title;
/* the sharing picture: the one chosen in the admin (a library picture, made
   1254 pixels on its long side at publish), or the designed og.jpg */
const SHARE = (() => {
  const im = SEO.home && SEO.home.image, m = im && /^media:([0-9a-f-]{36})$/.exec(im.media || "");
  if (!m || !(im.w > 0 && im.h > 0)) return null;
  const k = Math.min(1, 1254 / Math.max(im.w, im.h));
  return { url: `${base}/img/m-${m[1]}-1254.jpg`, w: Math.round(im.w * k), h: Math.round(im.h * k), alt: String((im.alt && im.alt.en) || "SILAVU").replace(/"/g, "&quot;").replace(/</g, "&lt;") };
})();
const OG_IMG = SHARE ? SHARE.url : `${base}/og.jpg?v=7`;
const DESC = SEO.home.description;
const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">${/^https:/.test(base) ? '\n<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests; object-src \'none\'; base-uri \'self\'">' : ""}
<title data-en="${TITLE.en}" data-he="${TITLE.he}">${TITLE.en}</title>
<meta name="description" content="${DESC.en}">
<link rel="canonical" href="${base}/">
<meta name="theme-color" content="#000000">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="SILAVU">
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
<meta property="og:title" content="SILAVU | The Line of Desire">
<meta property="og:description" content="${DESC.en}">
<meta property="og:image" content="${OG_IMG}">
<meta property="og:image:secure_url" content="${OG_IMG}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="${SHARE ? SHARE.w : 1200}">
<meta property="og:image:height" content="${SHARE ? SHARE.h : 630}">
<meta property="og:image:alt" content="${SHARE ? SHARE.alt : "The SILAVU mark in white on black, above the words Private high jewellery, Dubai and Tel Aviv"}">
<meta property="og:url" content="${base}/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="SILAVU | The Line of Desire">
<meta name="twitter:description" content="${DESC.en}">
<meta name="twitter:image" content="${OG_IMG}">
<meta name="twitter:image:alt" content="${SHARE ? SHARE.alt : "The SILAVU mark in white on black, above the words Private high jewellery, Dubai and Tel Aviv"}">
<link rel="icon" href="favicon.ico?v=6" sizes="48x48 32x32 16x16">
<link rel="icon" href="icon-32.png?v=6" type="image/png" sizes="32x32">
<link rel="icon" href="icon-16.png?v=6" type="image/png" sizes="16x16">
<link rel="icon" href="favicon.svg?v=6" type="image/svg+xml" sizes="any">
<link rel="apple-touch-icon" href="icon-180.png?v=6" sizes="180x180">
<link rel="manifest" href="site.webmanifest?v=6">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fontLinks}
${fontPreload}
${cssLink}
<link rel="preload" as="image" fetchpriority="high" media="(min-width: 900px)" href="img/hero-1600.jpg" imagesrcset="img/hero-1600.jpg 1600w, img/hero-2560.jpg 2560w, img/hero-3840.jpg 3840w" imagesizes="100vw">
<link rel="preload" as="image" fetchpriority="high" media="(max-width: 899px)" href="img/herov-1080.jpg" imagesrcset="img/herov-1080.jpg 1080w, img/herov-1440.jpg 1440w" imagesizes="100vw">
<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "JewelryStore"],
      "@id": base + "/#house",
      "name": "SILAVU",
      "alternateName": ["Silavu", "SILAVU Jewellery", "SILAVU Fine Jewellery"],
      "slogan": "The Line of Desire",
      "description": "A private high-jewellery house in Dubai and Tel Aviv. House collection, bespoke commissions and the SILAVU Line, by appointment.",
      "url": base + "/",
      ...(sameAs.length ? { "sameAs": sameAs } : {}),
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
            "@id": base + "/pieces/" + p.id + "/#product",
            "url": base + "/pieces/" + p.id + "/",
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
            "offers": offerOf(p, base + "/pieces/" + p.id + "/")
            /* no "offers": an Offer without a price is not valid for product
               results, and the house does not publish prices; the pieces are
               quoted on request, which the page itself says in words */
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
    out += html.slice(at, from) + (/[\u0590-\u05ff]/.test(he) ? '<bdi dir="rtl">' + he.replace(/[0-9][0-9.,]*(?: *[–—-] *[0-9][0-9.,]*)+(?: +[A-Za-z]+)?|[0-9][0-9.,]*(?: *[×=] *[0-9][0-9.,]*)* +[A-Za-z]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z]{2,}/g, '<bdi dir="ltr">$&</bdi>') + "</bdi>" : (/[A-Za-z]/.test(he) ? '<bdi dir="ltr">' + he + "</bdi>" : he)); at = to; end = to;
  }
  const heHtml = (out + html.slice(at)).replace(/alt="([^"]*)" data-alt-he="([^"]*)"/g, 'alt="$2" data-alt-en="$1" data-alt-he="$2"')
    /* a piece's own page, from the Hebrew page, is its Hebrew page */
    .replace(/href="pieces\//g, 'href="he/pieces/');
  const heHead = head
    .replace('<html lang="en">', '<html lang="he" dir="rtl" data-lang="he" data-ns="1">')
    .replace(/<head>\n/, '<head>\n<base href="../">\n')
    .replace(/<title[^>]*>[^<]*<\/title>/, m => m.replace(/>[^<]*</, ">" + TITLE.he + "<"))
    .replace(/(<meta name="description" content=")[^"]*/, "$1" + DESC.he)
    .replace(`<link rel="canonical" href="${base}/">`, `<link rel="canonical" href="${base}/he/">`)
    .replace('<meta property="og:locale" content="en_US">', '<meta property="og:locale" content="he_IL">')
    .replace('<meta property="og:locale:alternate" content="he_IL">', '<meta property="og:locale:alternate" content="en_US">')
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${base}/he/`)
    .replace(/(<meta property="og:title" content=")[^"]*/, "$1SILAVU | The Line of Desire")
    .replace(/(<meta name="twitter:title" content=")[^"]*/, "$1SILAVU | The Line of Desire")
    .replace(/(<meta property="og:description" content=")[^"]*/, "$1" + DESC.he)
    .replace(/(<meta name="twitter:description" content=")[^"]*/, "$1" + DESC.he)
    .replace('<script>window.__silavuBuild', '<script>window.__pageLang="he";window.__silavuBuild');
  fs.mkdirSync(path.join(outDir, "he"), { recursive: true });
  fs.writeFileSync(path.join(outDir, "he", "index.html"), heHead + heHtml + "\n</body>\n</html>\n");
  console.log("hebrew page:", cuts.length, "strings written in");
}
/* /test/ and /test-white/: the home page with a candidate hero loop, for the
   house to look at before it replaces the one on the live page. Not listed,
   not indexed, not counted; the films and their stills come from
   hero-test-assets.sh (the dark one) and hero-white.py (the white one). The
   white one sets the hero's words in ink, since they are white on the film. */
const INK = `#hero .hshade{background:linear-gradient(to top,rgba(255,255,255,.72) 0%,rgba(255,255,255,.34) 32%,rgba(255,255,255,0) 60%),linear-gradient(to bottom,rgba(255,255,255,.6),rgba(255,255,255,0) 26%)}
#hero .hlight,#hero .hseam{display:none}
#hero .hcap .h em,#hero .hcap .h em *{background:none!important;-webkit-text-fill-color:#16130f!important;filter:none!important}
#header:not(.scrolled)::before{opacity:0!important}
#header:not(.scrolled) .lang,#header:not(.scrolled) .btn{background:rgba(255,255,255,.55)!important}
#hero .hcap,#hero .hcap *,#hero .hfacts,#hero .hfacts *{color:#16130f!important;text-shadow:none!important}
#hero .hcap .btn{border-color:rgba(22,19,15,.45)!important}
#hero .hcap .btn:first-child{background:#16130f!important;color:#f6f2ea!important;border-color:#16130f!important}
#hero .hcap .btn:first-child *{color:#f6f2ea!important}
#header:not(.scrolled),#header:not(.scrolled) *{color:#16130f!important;text-shadow:none!important}
#header:not(.scrolled) a,#header:not(.scrolled) button{border-color:rgba(22,19,15,.35)!important}`;
/* the emblem in metal (src/emb3d.js), tried on /test/ only: the library and
   its two helpers are copied from node_modules, their imports pointed at
   each other, and the module is loaded when the chapter comes near */
const EMB3D = (() => {
  const nm = path.join(path.dirname(path.resolve(src)), "..", "node_modules", "three");
  if (!fs.existsSync(path.join(nm, "build", "three.module.min.js"))) { console.warn("emblem 3D skipped: three is not installed"); return null; }
  const d3 = path.join(outDir, "3d"); fs.mkdirSync(d3, { recursive: true });
  const local = f => fs.readFileSync(f, "utf8").replace(/from\s*['"]three['"]/g, "from './three.module.min.js'");
  fs.copyFileSync(path.join(nm, "build", "three.module.min.js"), path.join(d3, "three.module.min.js"));
  fs.writeFileSync(path.join(d3, "SVGLoader.js"), local(path.join(nm, "examples", "jsm", "loaders", "SVGLoader.js")));
  fs.writeFileSync(path.join(d3, "RoomEnvironment.js"), local(path.join(nm, "examples", "jsm", "environments", "RoomEnvironment.js")));
  const js = fs.readFileSync(path.join(path.dirname(path.resolve(src)), "src", "emb3d.js"), "utf8"), v = hashOf(js);
  fs.writeFileSync(path.join(d3, "emb3d.js"), js);
  return {
    css: `#enquire .embpave{display:none!important}
#enquire .embart canvas.emb3d{position:absolute;left:-30%;top:-15%;width:160%;height:130%;pointer-events:none;opacity:0;transform:scale(.94);transition:opacity 1.6s ease,transform 2.2s cubic-bezier(.2,.8,.2,1)}
#enquire .emb.e3d .embart canvas.emb3d{opacity:1;transform:none}
#enquire .emb.e3d .embsvg,#enquire .emb.e3d .embshine,#enquire .emb.e3d .embart::after{opacity:0!important;transition:opacity 1.2s ease}
#enquire .emb.e3d .embtilt{transform:scale(var(--sc,1))!important}`,
    js: `<script type="module">(function(){var emb=document.getElementById("emb"),host=emb&&emb.querySelector(".embart"),p=emb&&emb.querySelector(".embfill");if(!host||!p||matchMedia("(prefers-reduced-motion: reduce)").matches||!("IntersectionObserver" in window))return;var w=parseFloat((emb.querySelector(".embsvg").getAttribute("viewBox")||"0 0 872 1000").split(" ")[2]);var io=new IntersectionObserver(function(es){if(!es.some(function(e){return e.isIntersecting}))return;io.disconnect();import("./3d/emb3d.js?v=${v}").then(function(m){m.start(emb,host,p.getAttribute("d"),w)}).catch(function(){})},{rootMargin:"700px"});io.observe(emb)})();</script>`,
  };
})();
function heroTest(dir, film, css, big, extras) {
  extras = (extras || []).filter(Boolean);
  const extra = extras.length ? { css: extras.map(x => x.css).join("\n"), js: extras.map(x => x.js).join(""), attrs: extras.map(x => x.attrs || "").join("") } : null;
  const W = big ? [1600, 1920, 2560, 3840] : [1600, 1920], set = W.map(w => `img/${film}-${w}.jpg ${w}w`).join(", ");
  const tHead = head
    .replace(/<head>\n/, '<head>\n<base href="../">\n')
    .replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex,nofollow">')
    .replace(/<title[^>]*>[^<]*<\/title>/, m => m.replace(/>[^<]*</, ">SILAVU · hero test<"))
    .replace(/<link rel="preload" as="image"[^>]*herov?-[^>]*>\n/g, "")
    .replace("</head>", `<link rel="preload" as="image" fetchpriority="high" href="img/${film}-1920.jpg" imagesrcset="${set}" imagesizes="100vw">\n<style>@media (max-width:899px){#hero .hv{object-position:${big ? 50 : 42}% 50%}}${css}${extra ? extra.css : ""}</style>\n</head>`);
  const tHtml = html
    .replace(/<source media="\(max-width:899px\)" srcset="img\/herov-[^>]*>/, big
      ? `<source media="(max-width:899px)" srcset="img/${film}-v-1080.jpg 1080w, img/${film}-v-1216.jpg 1216w" sizes="100vw">`
      : `<source media="(max-width:899px)" srcset="img/${film}-1600.jpg 1600w, img/${film}-1920.jpg 1920w" sizes="100vw">`)
    .replace(/(<img class="hv" id="heroimg") src="[^"]*" srcset="[^"]*"/, `$1 src="img/${film}-1920.jpg" srcset="${set}"`)
    .replace(/<video class="hv" id="herovid"[^>]*>/, `<video class="hv" id="herovid" muted playsinline loop autoplay preload="metadata" data-src="v/${film}.mp4" data-src-m="v/${film}-${big ? "v" : "720"}.mp4"${big ? ` data-src-4k="v/${film}-4k.mp4"` : ""}${extra ? extra.attrs : ""} aria-hidden="true">`)
    .replace(/window\.SILAVU_TRACK = (?=\{)/, "window.SILAVU_TRACK_OFF = ")
    .replace(/<\/body>\s*$/, "") + (extra ? extra.js : "");
  if (!tHtml.includes(`data-src="v/${film}.mp4"`) || !tHtml.includes(`${film}-1920.jpg`)) { console.warn(`hero test page ${dir} skipped: the hero markup has changed`); return; }
  fs.mkdirSync(path.join(outDir, dir), { recursive: true });
  fs.writeFileSync(path.join(outDir, dir, "index.html"), tHead + tHtml + "\n</body>\n</html>\n");
  console.log("hero test page written:", dir);
}
heroTest("test", "hero-cloche", "", true, [EMB3D]);
heroTest("test-white", "hero-white", INK);
let POLICY_SLUGS = [], PIECE_URLS = [];
/* the counter as a file of its own for the other pages (the home page carries it inline) */
let TRACK_HASH = "";
if (FUNCTIONS_URL && ANALYTICS !== "off") { const t = fs.readFileSync(path.join(SRCDIR, "src", "track.js"), "utf8"); TRACK_HASH = hashOf(t); fs.mkdirSync(ASSETS, { recursive: true }); fs.writeFileSync(path.join(ASSETS, "track." + TRACK_HASH + ".js"), t); }
const escA = v => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
fs.writeFileSync(path.join(outDir, ".nojekyll"), "");

/* The house documents and the About page. Real pages at real addresses, so a
   reader can link to the answer and a crawler can find it. They are part of
   the site, not print-outs of it: black like the rest of the house, the mark
   at the top leading home, the same chapters one click away, every document
   in the footer, and the language the reader chose on the site. */
{
  const { mark, logo } = await import("./src/body.mjs");
  POLICY_SLUGS = [ABOUT.slug, ...POLICIES.map(d => d.slug), ...DOCPAGES.map(d => d.slug)];
  const A = x => `data-en="${escA(x.en)}" data-he="${escA(x.he)}"`;
  const T = (tag, x, cls = "") => `<${tag}${cls ? ` class="${cls}"` : ""} ${A(x)}>${x.en}</${tag}>`;
  const S = (en, he) => ({ en, he });
  /* the documents get the site's own type and palette: the stylesheet lives
     in a <style> block inside the page body, not in the shared head */
  const styleBlock = ""; /* the documents load the shared stylesheet from the head */
  /* the same menu as the home page, as the admin left it: its words, the
     links it removed and the ones it added; a chapter link points home */
  const unA = v => v.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  const topnav = (pageSrc.match(/<nav id="topnav">([\s\S]*?)<\/nav>/) || [])[1] || "";
  const parsed = [...topnav.matchAll(/<a href="([^"]*)" data-en="([^"]*)" data-he="([^"]*)">/g)].map(m => [m[1].startsWith("#") ? "./" + m[1] : unA(m[1]), S(unA(m[2]), unA(m[3]))]);
  const NAV = parsed.length ? parsed : [
    ["./#collection", S("Collection", "הקולקציה")],
    ["./#build", S("The Line", "הקו")],
    ["about/", S("About", "אודות")]
  ];
  const LANGS = [["en", "EN"], ["he", "עב"], ["fr", "FR"], ["ar", "AR"], ["ru", "RU"]];
  const header = here => `<header class="dhd">
<a class="dhome" href="./" aria-label="SILAVU, home" data-aria-he="SILAVU, דף הבית">${mark("dmk", "b")}${logo("dlg")}</a>
<nav class="dnav" aria-label="Site" data-aria-he="ניווט באתר">${NAV.map(([h, t]) => `<a href="${h}"${h === here + "/" ? ' aria-current="page"' : ""} ${A(t)}>${t.en}</a>`).join("")}</nav>
<div class="dact"><div class="dlang" role="group" aria-label="Language" data-aria-he="שפה">${LANGS.map(([c, l]) => `<button type="button" data-lang="${c}" lang="${c}">${l}</button>`).join("")}</div>
<a class="dbook" href="./#concierge" ${A(S("Private appointment", "פגישה פרטית"))}>Private appointment</a></div>
</header>`;
  const footer = here => `<footer class="dft">
<a class="dhome" href="./" aria-label="SILAVU, home" data-aria-he="SILAVU, דף הבית">${mark("dmk", "b")}${logo("dlg")}</a>
<div class="dfcols">
<div><div class="k" ${A(S("The house", "בית התכשיטים"))}>The house</div>${NAV.map(([h, t]) => `<a href="${h}" ${A(t)}>${t.en}</a>`).join("")}</div>
<details class="dfcare" open data-fold><summary class="k" ${A(S("Client care", "שירות לקוחות"))}>Client care</summary><div class="dfcarel">${FOOTER_DOCS.map(o => `<a href="${o.slug}/"${o.slug === here ? ' aria-current="page"' : ""} ${A(o.title)}>${o.title.en}</a>`).join("")}</div></details>
<div><div class="k" ${A(S("Contact", "יצירת קשר"))}>Contact</div><a href="mailto:concierge@silavu.com" dir="ltr">concierge@silavu.com</a><a href="./#concierge" ${A(S("Book a private viewing", "קביעת פגישה פרטית"))}>Book a private viewing</a><span class="k dfwhere" ${A(S("Dubai · Tel Aviv · By appointment", "דובאי · תל אביב · בתיאום מראש"))}>Dubai · Tel Aviv · By appointment</span></div>
</div>
<div class="dfbot k"><span dir="ltr">© SILAVU&nbsp;<span class="fyr">${new Date().getFullYear()}</span></span><a href="${here}/#top" ${A(S("Back to the top", "חזרה למעלה"))}>Back to the top</a></div>
</footer>`;
  /* the reader's language, applied before the first paint where it can be:
     Hebrew is in the page, the others come from the site's dictionaries */
  const langScript = titleOf => `<script>(function () {
  var h = document.documentElement, cache = {}, orig = document.title;
  /* on a phone the service documents fold under one heading; open everywhere else */
  if (matchMedia("(max-width:899px)").matches) document.querySelectorAll("details[data-fold]").forEach(function (d) { d.open = false; });
  document.querySelectorAll(".fyr").forEach(function (e) { e.textContent = new Date().getFullYear(); });
  function apply(l, dict) {
    var rtl = l === "he" || l === "ar";
    h.lang = l; h.dir = rtl ? "rtl" : "ltr";
    if (rtl) h.setAttribute("data-ns", "1"); else h.removeAttribute("data-ns");
    document.querySelectorAll("[data-en]").forEach(function (el) {
      var en = el.getAttribute("data-en"), t = l === "en" ? en : l === "he" ? el.getAttribute("data-he") : dict && dict[en];
      el.innerHTML = rtl && t && /[\u0590-\u06ff]/.test(t) ? '<bdi dir="rtl">' + t.replace(/[0-9][0-9.,]*(?: *[–—-] *[0-9][0-9.,]*)+(?: +[A-Za-z]+)?|[0-9][0-9.,]*(?: *[×=] *[0-9][0-9.,]*)* +[A-Za-z]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z]{2,}/g, '<bdi dir="ltr">$&</bdi>') + "</bdi>" : (rtl && t && /[A-Za-z]/.test(t) ? '<bdi dir="ltr">' + t + "</bdi>" : (t || en));
    });
    document.querySelectorAll(".dlang button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-lang") === l ? "true" : "false"); });
    /* the way home follows the language: in Hebrew the house, its chapters and
       its pieces open at their Hebrew address directly, not by way of the
       English page and a redirect */
    document.querySelectorAll("a[href]").forEach(function (x) { var hr = x.getAttribute("href"), m = hr.match(/^(?:he\\/|\\.\\/)?(\\?[^#]*)?(#.*)?$|^(?:he\\/)?(pieces\\/.*)$/); if (!m) return;
      x.setAttribute("href", m[3] ? (l === "he" ? "he/" : "") + m[3] : (l === "he" ? "he/" : "./") + (m[1] || "") + (m[2] || "")); });
    /* what a screen reader hears follows the language too: photographs'
       descriptions and the names of buttons, in all five */
    document.querySelectorAll("img[data-alt-he]").forEach(function (im) { if (!im.hasAttribute("data-alt-en")) im.setAttribute("data-alt-en", im.alt); var en = im.getAttribute("data-alt-en"); im.alt = l === "he" ? im.getAttribute("data-alt-he") : l === "en" ? en : (dict && dict[en]) || en; });
    document.querySelectorAll("[data-aria-he]").forEach(function (el) { if (!el.hasAttribute("data-aria-en")) el.setAttribute("data-aria-en", el.getAttribute("aria-label") || ""); var en = el.getAttribute("data-aria-en"); el.setAttribute("aria-label", l === "he" ? el.getAttribute("data-aria-he") : l === "en" ? en : (dict && dict[en]) || en); });
    if (window.__ppLang) window.__ppLang(l, dict);
    var t1 = document.querySelector("[data-doc-title]");
    /* a page without a document title of its own (a piece) keeps the title it was written with */
    document.title = l === "en" || !t1 ? orig : t1.textContent ${titleOf};
  }
  /* The address says which language a page is in, so a copied link opens in
     the same one. A page with a Hebrew address of its own (a piece) moves
     between its two addresses; French, Russian and Arabic, and Hebrew on the
     documents, ride on ?lang= at the same address. */
  var qs = new URLSearchParams(location.search), qp = qs.get("lang"), fixed = window.__pageLang, alt = window.__alt;
  if (qp && !/^(en|he|fr|ar|ru)$/.test(qp)) qp = null;
  /* every relative address resolves from the site's root whatever the
     address bar says, so the address can change without the page reloading */
  try { var bs = document.querySelector("base"); if (bs) bs.href = bs.href; } catch (e) {}
  function go(l, first) {
    /* a piece moves between its two addresses in place: no reload, and the
       reader stays exactly where they were */
    if (alt && !first && (l === "he") !== (fixed === "he")) {
      var y = scrollY; fixed = l === "he" ? "he" : "en";
      try { var a = new URL(l === "he" ? alt.he : alt.en, document.baseURI); if (l !== "he" && l !== "en") a.searchParams.set("lang", l); a.hash = location.hash;
        history.replaceState(null, "", a.pathname + a.search + a.hash); } catch (e) {}
      /* and the links follow: home, its chapters and the other pieces open in
         the language now showing */
      document.querySelectorAll("a[href]").forEach(function (x) { var hr = x.getAttribute("href"), m = hr.match(/^(?:he\\/|\\.\\/)?(\\?[^#]*)?(#.*)?$|^(?:he\\/)?(pieces\\/.*)$/); if (!m) return;
        x.setAttribute("href", m[3] ? (l === "he" ? "he/" : "") + m[3] : (l === "he" ? "he/" : "./") + (m[1] || "") + (m[2] || "")); });
      requestAnimationFrame(function () { scrollTo({ top: y, behavior: "instant" }); });
    }
    try { localStorage.setItem("silavu-lang", l); } catch (e) {}
    try { var u = new URL(location.href); if (l === "en" || (alt && l === "he")) u.searchParams.delete("lang"); else u.searchParams.set("lang", l);
      if (u.href !== location.href) history.replaceState(null, "", u.pathname + u.search + u.hash); } catch (e) {}
    if (l === "en" || l === "he" || cache[l]) return apply(l, cache[l]);
    fetch("lang/" + l + ".json", { cache: "force-cache" }).then(function (r) { return r.json(); })
      .then(function (d) { cache[l] = d; apply(l, d); }).catch(function () { apply("en"); });
  }
  /* on a phone the switch is one button: the language you are in opens the
     others, any other choice switches and closes it */
  var dl = document.querySelector(".dlang"), narrow = { matches: true };
  document.querySelectorAll(".dlang button").forEach(function (b) { b.addEventListener("click", function (e) {
    if (narrow.matches && b.getAttribute("aria-pressed") === "true" && !dl.classList.contains("open")) { dl.classList.add("open"); e.stopPropagation(); return; }
    if (dl) dl.classList.remove("open"); go(b.getAttribute("data-lang")); }); });
  document.addEventListener("click", function (e) { if (dl && !dl.contains(e.target)) dl.classList.remove("open"); });
  var l = "en"; try { l = localStorage.getItem("silavu-lang") || "en"; } catch (e) {}
  if (fixed === "he") l = "he"; else if (alt) l = qp && qp !== "he" ? qp : "en"; else if (qp) l = qp;
  go(l, true);
})();</script>`;
  const page = (slug, title, desc, inner, titleOf, o = {}) => {
    const dir = path.join(outDir, slug);
    fs.mkdirSync(dir, { recursive: true });
    const up = "../".repeat(slug.split("/").length);
    let dhead = head
      .replace(/<title[^>]*>[^<]*<\/title>/, `<title>${title}</title>`)
      .replace(/(<meta name="description" content=")[^"]*/, `$1${escA(desc)}`)
      .replace(`<link rel="canonical" href="${base}/">`, `<link rel="canonical" href="${base}/${slug}/">`)
      /* the site lives under a sub-path on Pages: every relative address in
         the shared head and in the documents resolves from the site root */
      .replace(/<head>\n/, `<head>\n<base href="${up}">\n`)
      /* the documents never show the opening photograph */
      .replace(/<link rel="preload" as="image"[^>]*>\n/g, "")
      .replace(/<link rel="alternate" hreflang[^>]*>\n/g, "")
      .replace(/(<meta property="og:url" content=")[^"]*/, `$1${base}/${slug}/`)
      .replace(/(<meta property="og:title" content=")[^"]*/, `$1${title}`)
      .replace(/(<meta property="og:description" content=")[^"]*/, `$1${escA(desc)}`)
      .replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${title}`)
      .replace(/(<meta name="twitter:description" content=")[^"]*/, `$1${escA(desc)}`);
    if (o.he) dhead = dhead.replace('<html lang="en">', '<html lang="he" dir="rtl" data-lang="he" data-ns="1">');
    if (o.alt) dhead = dhead.replace(/(<meta property="og:locale")/, `<link rel="alternate" hreflang="en" href="${base}/${o.alt.en}">\n<link rel="alternate" hreflang="he" href="${base}/${o.alt.he}">\n<link rel="alternate" hreflang="x-default" href="${base}/${o.alt.en}">\n$1`);
    if (o.image) dhead = dhead.replace(/(<meta property="og:image" content=")[^"]*/, `$1${o.image}`).replace(/(<meta name="twitter:image" content=")[^"]*/, `$1${o.image}`);
    /* a piece shares as itself: its own photograph, its real size, its own words */
    if (o.imageAlt) dhead = dhead.replace(/(<meta property="og:image:alt" content=")[^"]*/, `$1${escA(o.imageAlt)}`).replace(/(<meta name="twitter:image:alt" content=")[^"]*/, `$1${escA(o.imageAlt)}`);
    if (o.imageSize) dhead = dhead.replace(/(<meta property="og:image:width" content=")[^"]*/, `$1${o.imageSize}`).replace(/(<meta property="og:image:height" content=")[^"]*/, `$1${o.imageSize}`);
    if (o.product) dhead = dhead.replace(/(<meta property="og:type" content=")[^"]*/, "$1product");
    /* a white page is white up to the top of the phone: the browser paints its
       bar from the theme colour and from the page's own background, so both
       are white, and the home-screen status bar is dark text on white */
    if (o.light) dhead = dhead.replace(/(<meta name="theme-color" content=")[^"]*/, "$1#ffffff")
      .replace(/(<meta name="apple-mobile-web-app-status-bar-style" content=")[^"]*/, "$1default")
      .replace(/<html /, '<html class="lightpg" ')
      .replace(/(<meta name="theme-color"[^>]*>)/, '$1\n<meta name="color-scheme" content="light">\n<style>html.lightpg,html.lightpg body{background:#fff!important}</style>');
    if (o.schema) dhead = dhead.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => `<script type="application/ld+json">${JSON.stringify(o.schema)}</script>`);
    let chrome = `<div class="dpage${o.light ? " light" : ""}" id="top">\n${header(slug)}\n${inner}\n${footer(slug)}\n</div>\n`;
    /* the Hebrew address keeps a reader on Hebrew addresses */
    if (o.he) chrome = chrome.replace(/href="\.\/(\?[^"#]*)?(#[^"]*)?"/g, (m, q, h) => `href="he/${q || ""}${h || ""}"`).replace(/href="(pieces\/[^"]*)"/g, 'href="he/$1"');
    const pre = o.alt ? `<script>window.__alt=${JSON.stringify(o.alt)};${o.he ? 'window.__pageLang="he";' : 'window.__pageLang="en";'}</script>` : "";
    /* the visit counter, on every page, when the backend is connected */
    const track = FUNCTIONS_URL && ANALYTICS !== "off" ? `<script>window.SILAVU_TRACK=${JSON.stringify({ url: FUNCTIONS_URL + "/collect", mode: ANALYTICS, privacy: "privacy/" })};</script><script src="assets/track.${TRACK_HASH}.js" defer></script>` : "";
    const body = styleBlock + chrome + pre + langScript(titleOf) + (o.script || "") + track;
    fs.writeFileSync(path.join(dir, "index.html"), dhead + body + "\n</body>\n</html>\n");
  };
  for (const d of POLICIES) {
    const inner = policyMain(d);
    /* the description is the page's own words: its lede and the first
       sentence of what follows, kept to what a results page shows */
    const first = (d.body[0][1].en.match(/^[^.!?]+[.!?]/) || [""])[0];
    const ddesc = (d.lede.en + " " + first).length <= 160 ? d.lede.en + " " + first : d.lede.en;
    page(d.slug, `${d.title.en} | SILAVU`, ddesc, inner, '+ " | SILAVU"');
  }
  /* pages the owner made in the admin, from the same document template.
     Their text is plain, with *emphasis*; nothing in them can carry markup. */
  for (const d of DOCPAGES) {
    const inner = docpageMain(d);
    const st = (d.seo && d.seo.title && d.seo.title.en) || `${d.title.en.replace(/\*/g, "")} | SILAVU`;
    const sd = (d.seo && d.seo.description && d.seo.description.en) || (d.lede && d.lede.en) || "";
    page(d.slug, st, sd, inner, '+ " | SILAVU"');
  }
  {
    const a = ABOUT;
    const portrait = a.portrait
      ? `<img src="${a.portrait}-1100.jpg" srcset="${a.portrait}-800.jpg 800w, ${a.portrait}-1100.jpg 1100w" sizes="(min-width:900px) 38vw, 92vw" width="1100" height="1375" fetchpriority="high" alt="${escA(a.name.en)}, ${escA(a.role.en)} of SILAVU" data-alt-he="${escA(a.name.he)}, ${escA(a.role.he)} SILAVU">`
      : `<div class="aph" role="img" aria-label="${escA(a.name.en)}">${mark("aphmk", "b")}</div>`;
    const inner = `<main class="doc about">
<span data-doc-title hidden ${A(a.seo)}>${a.seo.en}</span>
<section class="ahero2 aletterpage">
${aboutText(a)}
<div class="acol"><figure class="aport">${portrait}${aboutCaption(a)}</figure>${(() => { const r = PIECES.find(x => x.id === "ring"), sh = r && r.shots.find(x => x.img === "ring-macro"); if (!sh) return "";
  /* one detail of the house's own work, from the approved photography: the
     pavé signature of ICON, close. It sits under the portrait on a wide
     screen and is left out on a phone, so the page grows no longer. */
  return `<figure class="adetail"><img src="img/${sh.img}-900.jpg" srcset="img/${sh.img}-640.jpg 640w, img/${sh.img}-900.jpg 900w, img/${sh.img}-1254.jpg 1254w" sizes="(min-width:1000px) 30vw, 1px" width="1254" height="1254" loading="lazy" decoding="async" alt="${escA(sh.alt.en)}" data-alt-he="${escA(sh.alt.he)}"><figcaption class="k" ${A(S("SILAVU ICON, the pavé signature", "SILAVU ICON, חתימת הפאווה"))}>SILAVU ICON, the pavé signature</figcaption></figure>`; })()}</div>
</section>
</main>`;
    /* the tab reads the same in every language; the heading carries markup */
    page(a.slug, a.seo.en, a.desc.en, inner, "");
  }
  /* Every piece has its own address, in English and in Hebrew: the whole
     piece written into the page (name, description, story, specification,
     every photograph described), its own title and description, and its own
     structured data. The window on the home page stays as the quick view. */
  {
    const plain = x => String(x).replace(/<[^>]+>/g, "");
    const shown = PIECES.filter(p => p.id && !p.exceptional);
    const img = (sh, p, i) => { const w = p.widths || [800, 1200]; return `<img src="img/${sh.img}-${w[Math.min(1, w.length - 1)]}.jpg" srcset="${w.map(x => `img/${sh.img}-${x}.jpg ${x}w`).join(", ")}" sizes="(min-width:900px) 52vw, 100vw" alt="${escA(sh.alt.en)}" data-alt-he="${escA(sh.alt.he)}"${i ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"'}>`; };
    /* The piece's gallery: one photograph at a time in a stage that scrolls
       sideways (a finger swipes it natively; the page still scrolls up and
       down), arrows and thumbnails for a mouse and the keyboard, a count of
       where you are, and an enlarged view at the photograph's own size. */
    const galScript = `<script>(function () {
  var g = document.querySelector(".ppgal"); if (!g) return;
  var track = g.querySelector(".pptrack"), slides = [].slice.call(track.children), n = slides.length, cur = 0;
  /* a film, when the piece has one, is the first slide: it plays only while
     it is the slide in view, and never with reduced motion */
  var film = g.querySelector(".ppvid");
  function filmPlay(on) { if (!film) return;
    /* the film is fetched when it is first wanted, at the size the screen needs */
    if (on && !film.getAttribute("src")) { film.src = film.getAttribute(innerWidth < 900 ? "data-src-sm" : "data-src"); } if (on && !matchMedia("(prefers-reduced-motion: reduce)").matches) { var pr = film.play(); if (pr && pr.catch) pr.catch(function () {}); } else film.pause(); }
  if (film && "IntersectionObserver" in window) new IntersectionObserver(function (es) { es.forEach(function (e) { filmPlay(e.isIntersecting && cur === 0); }); }, { threshold: 0.4 }).observe(film);
  var dots = [].slice.call(g.querySelectorAll(".ppdots i")), ths = [].slice.call(g.querySelectorAll(".ppth")), cnt = g.querySelector(".ppcur");
  var still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function mark(i) { cur = i; dots.forEach(function (d, k) { d.classList.toggle("on", k === i); });
    ths.forEach(function (t, k) { t.classList.toggle("on", k === i); t.setAttribute("aria-current", k === i ? "true" : "false"); });
    if (cnt) cnt.textContent = i + 1; filmPlay(i === 0); }
  function go(i) { i = (i + n) % n; mark(i); track.scrollTo({ left: i * track.clientWidth, behavior: still ? "auto" : "smooth" }); }
  var raf = 0; track.addEventListener("scroll", function () { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; var i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth)); if (i !== cur && i >= 0 && i < n) mark(i); }); }, { passive: true });
  g.querySelectorAll(".ppstage .ppprev").forEach(function (b) { b.addEventListener("click", function () { go(cur - 1); }); });
  g.querySelectorAll(".ppstage .ppnext").forEach(function (b) { b.addEventListener("click", function () { go(cur + 1); }); });
  ths.forEach(function (t) { t.addEventListener("click", function () { go(+t.getAttribute("data-i")); }); });
  track.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { e.preventDefault(); go(cur + 1); } else if (e.key === "ArrowLeft") { e.preventDefault(); go(cur - 1); } });
  addEventListener("resize", function () { track.scrollTo({ left: cur * track.clientWidth }); });
  /* the enlarged view: the photograph as it was shot, never stretched past it */
  var box = document.getElementById("ppbox"), bimg = box.querySelector("img"), bcnt = box.querySelector(".ppcount"), back = null, bi = 0;
  /* the enlarged view walks the photographs only; the film is not one */
  var pics = slides.filter(function (sl) { return sl.querySelector(".ppzoom img"); }), pn = pics.length;
  function show(i) { bi = (i + pn) % pn; var im = pics[bi].querySelector("img"); box.classList.remove("zoom"); bimg.style.transformOrigin = "";
    bimg.src = im.getAttribute("data-full"); bimg.alt = im.alt; bcnt.textContent = (bi + 1) + " / " + pn; }
  function open(i) { back = document.activeElement; show(i); box.hidden = false; document.documentElement.classList.add("ppopen"); box.querySelector(".ppx").focus(); }
  function close() { box.hidden = true; document.documentElement.classList.remove("ppopen"); go(slides.indexOf(pics[bi])); if (back && back.focus) back.focus(); }
  pics.forEach(function (sl, i) { sl.querySelector(".ppzoom").addEventListener("click", function () { open(i); }); });
  box.querySelector(".ppx").addEventListener("click", close);
  box.querySelector(".ppprev").addEventListener("click", function () { show(bi - 1); });
  box.querySelector(".ppnext").addEventListener("click", function () { show(bi + 1); });
  box.addEventListener("click", function (e) { if (e.target === box) close(); });
  /* on a fine pointer the photograph can be looked into at its own size */
  bimg.addEventListener("click", function (e) { if (!matchMedia("(pointer:fine)").matches) return; var r = bimg.getBoundingClientRect(), k = bimg.naturalWidth / Math.max(1, r.width);
    if (box.classList.contains("zoom")) { box.classList.remove("zoom"); return; } if (k < 1.15) return;
    bimg.style.setProperty("--zk", k.toFixed(3)); bimg.style.transformOrigin = ((e.clientX - r.left) / r.width * 100).toFixed(1) + "% " + ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%"; box.classList.add("zoom"); });
  bimg.addEventListener("mousemove", function (e) { if (!box.classList.contains("zoom")) return; var r = box.getBoundingClientRect(); bimg.style.transformOrigin = ((e.clientX - r.left) / r.width * 100).toFixed(1) + "% " + ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%"; });
  var sx = 0; box.addEventListener("pointerdown", function (e) { sx = e.clientX; }); box.addEventListener("pointerup", function (e) { if (e.pointerType === "mouse") return; var dx = e.clientX - sx; if (Math.abs(dx) > 40) show(bi + (dx < 0 ? 1 : -1)); });
  document.addEventListener("keydown", function (e) { if (box.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); close(); } else if (e.key === "ArrowRight") show(bi + 1); else if (e.key === "ArrowLeft") show(bi - 1);
    else if (e.key === "Tab") { var f = [].slice.call(box.querySelectorAll("button")), a = f.indexOf(document.activeElement); e.preventDefault(); f[(a + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus(); } });
})();</script>`;
    const pick = (x, he) => he ? x.he : x.en;
    const AT = (x, he) => `${A(x)}>${pick(x, he)}`;
    for (const he of [false, true]) for (const p of shown) {
      const slug = (he ? "he/" : "") + "pieces/" + p.id;
      const alt = { en: "pieces/" + p.id + "/", he: "he/pieces/" + p.id + "/" };
      const others = shown.filter(q => q !== p);
      const F = p.film, n = p.shots.length + (F ? 1 : 0), W = p.widths || [800, 1200], big = W[W.length - 1];
      const filmSlide = F ? `<li class="ppslide ppfilm" aria-roledescription="slide" aria-label="1 / ${n}"><video class="ppvid" data-src="${F.src}.mp4" data-src-sm="${F.src}-720.mp4" poster="${F.poster}" muted loop playsinline preload="none" width="1080" height="1080" aria-label="${escA(F.alt.en)}" data-aria-he="${escA(F.alt.he)}"></video></li>` : "";
      const filmThumb = F ? `<button type="button" class="ppth ppthfilm on" data-i="0" aria-current="true" aria-label="${escA(F.alt.en)}" data-aria-he="${escA(F.alt.he)}"><img src="${F.poster}" alt="" loading="lazy" decoding="async" width="240" height="240"><i aria-hidden="true"></i></button>` : "";
      const o = F ? 1 : 0;
      const nm = plain(pick(p.name, he));
      /* the photograph in the stage: the piece whole, never cropped (contain),
         in the width the screen and its pixel density ask for; the largest
         width is the photograph as it was shot, and is what the enlarged view
         shows. Nothing is upscaled past it. */
      const stageImg = (sh, i) => `<img src="img/${sh.img}-${W[Math.min(1, W.length - 1)]}.jpg" srcset="${W.map(x => `img/${sh.img}-${x}.jpg ${x}w`).join(", ")}" sizes="(min-width:1240px) 700px, (min-width:900px) 56vw, 100vw" width="${big}" height="${big}" alt="${escA(sh.alt.en)}" data-alt-he="${escA(sh.alt.he)}" data-full="img/${sh.img}-${big}.jpg"${i ? ' loading="lazy" decoding="async"' : ' fetchpriority="high" decoding="async"'}>`;
      const thumb = (sh, i) => `<button type="button" class="ppth${i + o ? "" : " on"}" data-i="${i + o}" aria-current="${i + o ? "false" : "true"}" aria-label="${escA(sh.alt.en)}" data-aria-he="${escA(sh.alt.he)}"><img src="img/${sh.img}-${W[0]}.jpg" alt="" loading="lazy" decoding="async" width="${W[0]}" height="${W[0]}"></button>`;
      const careLinks = ["care", "warranty", "delivery", "authenticity"].map(sl => POLICIES.find(d => d.slug === sl)).filter(Boolean);
      const specs = p.specs.filter(r => !/^Price$/.test(r[0].en));
      const enq = `./?piece=${p.id}#concierge`;
      const inner = `<main class="doc ppage">
<nav class="crumbs k" aria-label="${he ? "מיקום" : "Breadcrumb"}" data-aria-he="מיקום"><a href="./#collection" ${AT(S("The collection", "הקולקציה"), he)}</a><i aria-hidden="true">/</i><span aria-current="page">${nm}</span></nav>
<div class="ppgrid">
<section class="ppgal" aria-roledescription="carousel" aria-label="${escA(nm)}" data-n="${n}">
<div class="ppstage">
<ul class="pptrack" tabindex="0" aria-label="${escA(nm)}">${filmSlide}${p.shots.map((sh, i) => `<li class="ppslide" aria-roledescription="slide" aria-label="${i + 1 + o} / ${n}"><button type="button" class="ppzoom" data-i="${i}" aria-label="Enlarge the photograph" data-aria-he="הגדלת התמונה">${stageImg(sh, i)}</button></li>`).join("")}</ul>
${n > 1 ? `<button type="button" class="ppnav ppprev" aria-label="Previous photograph" data-aria-he="התמונה הקודמת"></button><button type="button" class="ppnav ppnext" aria-label="Next photograph" data-aria-he="התמונה הבאה"></button>
<div class="ppcount k" aria-hidden="true"><span class="ppcur">1</span> / ${n}</div>
<div class="ppdots" aria-hidden="true">${(F ? [0] : []).concat(p.shots).map((sh, i) => `<i${i ? "" : ' class="on"'}></i>`).join("")}</div>` : ""}
</div>
${n > 1 ? `<div class="ppthumbs">${filmThumb}${p.shots.map(thumb).join("")}</div>` : ""}
</section>
<div class="pptext">
<div class="k gold" ${AT(p.kind || S("", ""), he)}</div>
<h1 ${AT(p.name, he)}</h1>
${p.sub ? `<p class="ppsub" ${AT(p.sub, he)}</p>` : ""}
<p class="lede" ${AT(p.line, he)}</p>
<dl class="ppkey">${(p.key || []).map(r => `<div><dt ${AT(r[0], he)}</dt><dd ${AT(r[1], he)}</dd></div>`).join("")}</dl>
<p class="pprice"><span ${AT(S("Price on request", "מחיר לפי בקשה"), he)}</span></p>
<div class="acta"><a class="btn solid ppenq" href="${enq}" data-piece-id="${p.id}" data-ref="${escA(p.ref)}" ${AT(S("Enquire about this piece", "פנייה לגבי התכשיט"), he)}</a><a class="lnk ppback" href="./#collection" ${AT(S("Back to the collection", "חזרה לקולקציה"), he)}</a></div>
<div class="ppacc">
${p.story ? `<details><summary ${AT(S("The story", "הסיפור"), he)}</summary><p class="p" ${AT(p.story, he)}</p></details>` : ""}
<details><summary ${AT(S("Specification", "מפרט"), he)}</summary><dl class="ppspecs">${specs.map(r => `<div><dt ${AT(r[0], he)}</dt><dd ${AT(r[1], he)}</dd></div>`).join("")}</dl></details>
<details><summary ${AT(S("Care and service", "טיפול ושירות"), he)}</summary><ul class="ppcare">${careLinks.map(d => `<li><a href="${d.slug}/" ${AT(d.title, he)}</a></li>`).join("")}</ul></details>
</div>
</div>
</div>
${others.length ? `<section class="ppmore"><h2 class="k" ${AT(S("Also in the collection", "עוד בקולקציה"), he)}</h2><ul>${others.map(q => `<li><a href="pieces/${q.id}/"><img src="img/${q.shots[0].img}-${(q.widths || [800])[0]}.jpg" alt="" loading="lazy" decoding="async"><span ${AT(q.name, he)}</span></a></li>`).join("")}</ul></section>` : ""}
<div class="ppbox" id="ppbox" role="dialog" aria-modal="true" aria-label="${escA(nm)}" hidden><button type="button" class="ppx" aria-label="Close" data-aria-he="סגירה"></button><button type="button" class="ppnav ppprev" aria-label="Previous photograph" data-aria-he="התמונה הקודמת"></button><figure><img alt=""></figure><button type="button" class="ppnav ppnext" aria-label="Next photograph" data-aria-he="התמונה הבאה"></button><div class="ppcount k" aria-live="polite"></div></div>
</main>`;
      /* the search title names the model, the metal and what it is; the
         description the piece in one sentence, its size, made to order */
      const title = p.seo ? pick(p.seo, he) : ((he ? (p.title && p.title.he) : (p.title && p.title.en)) || (plain(pick(p.name, he)) + " | SILAVU"));
      const size = (p.specs.find(r => /^(Length|Sizes?|Dimensions)$/.test(r[0].en)) || [])[1];
      const desc = (plain(pick(p.line, he)) + (size ? (he ? " " + plain(size.he) + "." : " " + plain(size.en) + ".") : "") + (he ? " מיוצר לפי הזמנה. " + plain(priceWords(p.price).he).replace(/[\u2066\u2069]/g, "") + "." : " Made to order. " + plain(priceWords(p.price).en) + ".")).replace(/\s+/g, " ");
      const image = base + "/img/" + p.shots[0].img + "-" + (p.widths || [1200]).slice(-1)[0] + ".jpg";
      const schema = { "@context": "https://schema.org", "@graph": [
        { "@type": "Product", "@id": base + "/pieces/" + p.id + "/#product", "url": base + "/" + alt.en, "name": p.plain || plain(p.name.en),
          "sku": p.ref.replace(/·/g, "-"), "description": plain(p.line.en) + (p.story ? " " + plain(p.story.en) : ""), "category": p.cat,
          "image": p.shots.map(sh => base + "/img/" + sh.img + "-" + (p.widths || [1200]).slice(-1)[0] + ".jpg"),
          "brand": { "@type": "Brand", "name": "SILAVU" },
          "material": plain(((p.specs.find(r => r[0].en === "Metal") || [])[1] || S("18K white gold", "")).en),
          "alternateName": p.plainHe || undefined,
          "additionalProperty": p.specs.filter(r => !/^Price$/.test(r[0].en)).map(r => ({ "@type": "PropertyValue", "name": r[0].en, "value": plain(r[1].en) })),
          "offers": offerOf(p, base + "/" + alt.en) },
        { "@type": "BreadcrumbList", "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "SILAVU", "item": base + "/" + (he ? "he/" : "") },
          { "@type": "ListItem", "position": 2, "name": plain(pick(p.name, he)), "item": base + "/" + (he ? alt.he : alt.en) } ] } ] };
      page(slug, title, desc, inner, "", { he, alt, image, schema, script: galScript, light: true, imageAlt: pick(p.shots[0].alt, he), imageSize: big, product: true });
    }
    PIECE_URLS = shown.map(p => p.id);
    console.log("pieces:", PIECE_URLS.join(" "), "(en + he)");
  }
  console.log("documents:", POLICY_SLUGS.join(" "));
}
/* the extra languages travel as data, fetched only when someone picks one */
{
  const from = path.join(SRCDIR, "lang");
  if (fs.existsSync(from)) {
    const to = path.join(outDir, "lang");
    fs.mkdirSync(to, { recursive: true });
    /* the owner's translations (content: translations) are laid over the files */
    for (const f of fs.readdirSync(from)) if (f.endsWith(".json")) {
      const l = f.replace(/\.json$/, ""), extra = (TRANSLATIONS && TRANSLATIONS[l]) || {};
      if (!Object.keys(extra).length) { fs.copyFileSync(path.join(from, f), path.join(to, f)); continue; }
      const dict = JSON.parse(fs.readFileSync(path.join(from, f), "utf8"));
      for (const [k, v] of Object.entries(extra)) if (typeof v === "string" && v.trim()) dict[k] = safeInline(v);
      fs.writeFileSync(path.join(to, f), JSON.stringify(dict, null, 1) + "\n");
    }
    console.log("languages:", fs.readdirSync(to).join(" "));
  }
}
fs.writeFileSync(path.join(outDir, "robots.txt"),
  "User-agent: *\nAllow: /\nDisallow: " + new URL(base + "/").pathname + "admin/\n\nSitemap: " + base + "/sitemap.xml\n");
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
  + PIECE_URLS.flatMap(id => ["/pieces/" + id + "/", "/he/pieces/" + id + "/"].map(u => "  <url>\n    <loc>" + base + u + "</loc>\n"
      + "    <xhtml:link rel=\"alternate\" hreflang=\"en\" href=\"" + base + "/pieces/" + id + "/\"/>\n"
      + "    <xhtml:link rel=\"alternate\" hreflang=\"he\" href=\"" + base + "/he/pieces/" + id + "/\"/>\n"
      + "    <xhtml:link rel=\"alternate\" hreflang=\"x-default\" href=\"" + base + "/pieces/" + id + "/\"/>\n"
      + "    <lastmod>" + new Date().toISOString().slice(0, 10) + "</lastmod>\n"
      + "    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n")).join("")
  + POLICY_SLUGS.map(sl => "  <url>\n    <loc>" + base + "/" + sl + "/</loc>\n"
      + "    <lastmod>" + new Date().toISOString().slice(0, 10) + "</lastmod>\n"
      + "    <changefreq>yearly</changefreq>\n    <priority>0.3</priority>\n  </url>\n").join("")
  + "</urlset>\n");
/* A custom domain is one file away. Drop the bought domain into
   lumera/site/CNAME and GitHub Pages serves the site from it; everything
   above then needs the origin passed to match, which the workflow does. */
/* A page that does not exist answers in the house's own voice, in both
   languages, and leads back home. GitHub Pages serves 404.html for any
   missing address, from any depth, so everything in it is absolute. */
{ const root = (new URL(base + "/")).pathname, jost = fs.readdirSync(path.join(path.dirname(path.resolve(src)), "public/fonts")).find(f => /^jost-normal-latin-[0-9a-f]+\.woff2$/.test(f));
  fs.writeFileSync(path.join(outDir, "404.html"), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Not found · SILAVU</title><meta name="robots" content="noindex"><link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
<style>@font-face{font-family:Jost;font-weight:300 600;font-display:swap;src:url(${root}fonts/${jost}) format("woff2")}
html,body{margin:0;height:100%;background:#000;color:#f6f3ed}body{display:grid;place-items:center;padding:24px;box-sizing:border-box;font-family:Jost,system-ui,sans-serif;text-align:center}
main{display:grid;gap:18px;justify-items:center;max-width:520px}.k{font-size:.78rem;letter-spacing:.16em;color:#b3b0a8}
h1{margin:0;font-weight:400;text-transform:uppercase;letter-spacing:.035em;font-size:clamp(2rem,6vw,3.2rem);line-height:1.08}
p{margin:0;color:#dcd9d2;line-height:1.6}p[dir=rtl]{font-family:Assistant,Jost,system-ui,sans-serif}
a{margin-top:10px;display:inline-block;padding:14px 26px;border-radius:12px;background:#f6f3ed;color:#111;text-decoration:none;font-size:.82rem;letter-spacing:.1em;text-transform:uppercase}
a:focus-visible{outline:2px solid #e6d6b0;outline-offset:3px}</style></head>
<body><main><span class="k">SILAVU · 404</span><h1>This page is not here</h1>
<p>The address may have changed, or the piece has moved.</p><p dir="rtl" lang="he">העמוד הזה לא נמצא. אולי הכתובת השתנתה.</p>
<a href="${root}">Back to SILAVU</a></main></body></html>
`); }
const cnameSrc = path.join(path.dirname(src), "CNAME");
if (fs.existsSync(cnameSrc)) fs.copyFileSync(cnameSrc, path.join(outDir, "CNAME"));
console.log("static index written:", path.join(outDir, "index.html"), ((head.length + html.length) / 1024).toFixed(0) + " KB");

/* moved pages: a page at the old address that forwards (never over a real page) */
for (const r of REDIRECTS) {
  const dir = path.join(outDir, r.from);
  if (fs.existsSync(path.join(dir, "index.html"))) { console.warn("redirect skipped, a page exists at", r.from); continue; }
  const to = base + "/" + r.to;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Moved · SILAVU</title><meta name="robots" content="noindex"><link rel="canonical" href="${to}"><meta http-equiv="refresh" content="0; url=${to}"></head><body><p>This page has moved: <a href="${to}">${to}</a></p></body></html>\n`);
}
if (REDIRECTS.length) console.log("redirects:", REDIRECTS.length);

/* the public copy of what this build rendered: every field in it is already
   on the site. The next build falls back to it if the backend is unreachable. */
{
  fs.mkdirSync(path.join(outDir, "_content"), { recursive: true });
  fs.writeFileSync(path.join(outDir, "_content", "release.json"), JSON.stringify(publicRelease()));
  console.log("content:", CONTENT_INFO.source, CONTENT_INFO.release ? "release " + CONTENT_INFO.release : "");
}
/* the house address, wherever a page names it, is the one in the settings */
{
  const email = SETTINGS && SETTINGS.contact && SETTINGS.contact.email;
  if (email && email !== HOUSE_EMAIL && /^[^\s@"<>]+@[^\s@"<>]+\.[^\s@"<>]{2,}$/.test(email)) {
    const walk = d => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name);
      if (f.isDirectory()) walk(p); else if (f.name.endsWith(".html")) { const t = fs.readFileSync(p, "utf8"); if (t.includes(HOUSE_EMAIL)) fs.writeFileSync(p, t.split(HOUSE_EMAIL).join(email)); } } };
    walk(outDir);
  }
}
