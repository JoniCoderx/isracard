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

/* The house documents and the About page. Real pages at real addresses, so a
   reader can link to the answer and a crawler can find it. They are part of
   the site, not print-outs of it: black like the rest of the house, the mark
   at the top leading home, the same chapters one click away, every document
   in the footer, and the language the reader chose on the site. */
{
  const { POLICIES } = await import("./src/policies.mjs");
  const { ABOUT } = await import("./src/about.mjs");
  const { mark, logo } = await import("./src/body.mjs");
  POLICY_SLUGS = [ABOUT.slug, ...POLICIES.map(d => d.slug)];
  const A = x => `data-en="${escA(x.en)}" data-he="${escA(x.he)}"`;
  const T = (tag, x, cls = "") => `<${tag}${cls ? ` class="${cls}"` : ""} ${A(x)}>${x.en}</${tag}>`;
  const S = (en, he) => ({ en, he });
  /* the documents get the site's own type and palette: the stylesheet lives
     in a <style> block inside the page body, not in the shared head */
  const styleBlock = (html.match(/<style>[\s\S]*?<\/style>/) || [""])[0];
  const NAV = [
    ["./#collection", S("Collection", "הקולקציה")],
    ["./#bespoke", S("Bespoke", "בהתאמה אישית")],
    ["./#build", S("Your bracelet", "הצמיד שלכם")],
    ["about/", S("About", "אודות")]
  ];
  const LANGS = [["en", "EN"], ["he", "עב"], ["fr", "FR"], ["ar", "AR"], ["ru", "RU"]];
  const header = here => `<header class="dhd">
<a class="dhome" href="./" aria-label="SILAVU, home">${mark("dmk", "b")}${logo("dlg")}</a>
<nav class="dnav" aria-label="Site">${NAV.map(([h, t]) => `<a href="${h}"${h === here + "/" ? ' aria-current="page"' : ""} ${A(t)}>${t.en}</a>`).join("")}</nav>
<div class="dact"><div class="dlang" role="group" aria-label="Language">${LANGS.map(([c, l]) => `<button type="button" data-lang="${c}" lang="${c}">${l}</button>`).join("")}</div>
<a class="dbook" href="./#concierge" ${A(S("Book a viewing", "פגישה פרטית"))}>Book a viewing</a></div>
</header>`;
  const footer = here => `<footer class="dft">
<a class="dhome" href="./" aria-label="SILAVU, home">${mark("dmk", "b")}${logo("dlg")}</a>
<div class="dfcols">
<div><div class="k" ${A(S("The house", "בית התכשיטים"))}>The house</div>${NAV.map(([h, t]) => `<a href="${h}" ${A(t)}>${t.en}</a>`).join("")}<a href="./#concierge" ${A(S("Book a private viewing", "קביעת פגישה פרטית"))}>Book a private viewing</a></div>
<div><div class="k" ${A(S("Client care", "שירות לקוחות"))}>Client care</div>${POLICIES.map(o => `<a href="${o.slug}/"${o.slug === here ? ' aria-current="page"' : ""} ${A(o.title)}>${o.title.en}</a>`).join("")}</div>
<div><div class="k" ${A(S("Visit", "ביקור"))}>Visit</div><span ${A(S("Dubai", "דובאי"))}>Dubai</span><span ${A(S("Tel Aviv", "תל אביב"))}>Tel Aviv</span><span ${A(S("By appointment", "בתיאום מראש"))}>By appointment</span><a href="mailto:concierge@silavu.com">concierge@silavu.com</a></div>
</div>
<div class="dfbot k"><span>© SILAVU MMXXVI</span><a href="${here}/#top" ${A(S("Back to the top", "חזרה למעלה"))}>Back to the top</a></div>
</footer>`;
  /* the reader's language, applied before the first paint where it can be:
     Hebrew is in the page, the others come from the site's dictionaries */
  const langScript = titleOf => `<script>(function () {
  var h = document.documentElement, cache = {}, orig = document.title;
  function apply(l, dict) {
    var rtl = l === "he" || l === "ar";
    h.lang = l; h.dir = rtl ? "rtl" : "ltr";
    if (rtl) h.setAttribute("data-ns", "1"); else h.removeAttribute("data-ns");
    document.querySelectorAll("[data-en]").forEach(function (el) {
      var en = el.getAttribute("data-en"), t = l === "en" ? en : l === "he" ? el.getAttribute("data-he") : dict && dict[en];
      el.innerHTML = t || en;
    });
    document.querySelectorAll(".dlang button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-lang") === l ? "true" : "false"); });
    var t1 = document.querySelector("[data-doc-title]");
    document.title = l === "en" ? orig : (t1 ? t1.textContent : "") ${titleOf};
  }
  function go(l) {
    try { localStorage.setItem("silavu-lang", l); } catch (e) {}
    if (l === "en" || l === "he" || cache[l]) return apply(l, cache[l]);
    fetch("lang/" + l + ".json", { cache: "force-cache" }).then(function (r) { return r.json(); })
      .then(function (d) { cache[l] = d; apply(l, d); }).catch(function () { apply("en"); });
  }
  document.querySelectorAll(".dlang button").forEach(function (b) { b.addEventListener("click", function () { go(b.getAttribute("data-lang")); }); });
  var l = "en"; try { l = localStorage.getItem("silavu-lang") || "en"; } catch (e) {}
  go(l);
})();</script>`;
  const page = (slug, title, desc, inner, titleOf) => {
    const dir = path.join(outDir, slug);
    fs.mkdirSync(dir, { recursive: true });
    const dhead = head
      .replace(/<title[^>]*>[^<]*<\/title>/, `<title>${title}</title>`)
      .replace(/(<meta name="description" content=")[^"]*/, `$1${escA(desc)}`)
      .replace(`<link rel="canonical" href="${base}/">`, `<link rel="canonical" href="${base}/${slug}/">`)
      /* the site lives under a sub-path on Pages: every relative address in
         the shared head and in the documents resolves from the site root */
      .replace(/<head>\n/, `<head>\n<base href="../">\n`)
      /* the documents never show the opening photograph */
      .replace(/<link rel="preload" as="image"[^>]*>\n/g, "")
      .replace(/<link rel="alternate" hreflang[^>]*>\n/g, "")
      .replace(/(<meta property="og:url" content=")[^"]*/, `$1${base}/${slug}/`)
      .replace(/(<meta property="og:title" content=")[^"]*/, `$1${title}`)
      .replace(/(<meta property="og:description" content=")[^"]*/, `$1${escA(desc)}`)
      .replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${title}`)
      .replace(/(<meta name="twitter:description" content=")[^"]*/, `$1${escA(desc)}`);
    const body = styleBlock + `<div class="dpage" id="top">\n${header(slug)}\n${inner}\n${footer(slug)}\n</div>\n` + langScript(titleOf);
    fs.writeFileSync(path.join(dir, "index.html"), dhead + body + "\n</body>\n</html>\n");
  };
  for (const d of POLICIES) {
    const inner = `<main class="doc">
<div class="k gold" ${A(S("Client care", "שירות לקוחות"))}>Client care</div>
<h1 data-doc-title ${A(d.title)}>${d.title.en}</h1>
<p class="lede" ${A(d.lede)}>${d.lede.en}</p>
${d.body.map(([h, t]) => `<section>${T("h2", h)}${T("p", t)}</section>`).join("\n")}
<p class="dask"><span ${A(S("A question this page does not answer?", "יש שאלה שלא נענתה כאן?"))}>A question this page does not answer?</span> <a href="./#concierge" ${A(S("Write to the concierge", "כתבו לקונסיירז'"))}>Write to the concierge</a></p>
</main>`;
    page(d.slug, `${d.title.en} | SILAVU`, d.lede.en, inner, '+ " | SILAVU"');
  }
  {
    const a = ABOUT;
    const portrait = a.portrait
      ? `<img src="img/${a.portrait}-1200.jpg" srcset="img/${a.portrait}-800.jpg 800w, img/${a.portrait}-1200.jpg 1200w" sizes="(min-width:900px) 40vw, 92vw" alt="${escA(a.name.en)}, ${escA(a.role.en)}" data-alt-he="${escA(a.name.he)}, ${escA(a.role.he)}">`
      : `<div class="aph" role="img" aria-label="${escA(a.name.en)}">${mark("aphmk", "b")}</div>`;
    const inner = `<main class="doc about">
<span data-doc-title hidden ${A(a.seo)}>${a.seo.en}</span>
<header class="ahero">
<div class="k gold" ${A(a.eyebrow)}>${a.eyebrow.en}</div>
<h1 data-doc-title ${A(a.h1)}>${a.h1.en}</h1>
<p class="lede" ${A(a.lede)}>${a.lede.en}</p>
</header>
<section class="afounder">
<figure class="aport">${portrait}<figcaption><b ${A(a.name)}>${a.name.en}</b><span class="k" ${A(a.role)}>${a.role.en}</span></figcaption></figure>
<div class="atext">${T("h2", a.name)}${a.founder.map(p => T("p", p)).join("")}</div>
</section>
<section class="aatelier">
${T("h2", a.atelierH)}${T("p", a.atelierP, "aint")}
<ol class="aroles">${a.roles.map(([h, t]) => `<li>${T("h3", h)}${T("p", t)}</li>`).join("")}</ol>
</section>
<section class="aclose">${T("p", a.close)}<a class="btn solid" href="./#concierge" ${A(a.cta)}>${a.cta.en}</a></section>
</main>`;
    /* the tab reads the same in every language; the heading carries markup */
    page(a.slug, a.seo.en, a.desc.en, inner.replace("<h1 data-doc-title ", "<h1 "), "");
  }
  console.log("documents:", POLICY_SLUGS.join(" "));
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
