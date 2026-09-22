// Turn silavu-page.html into a self-contained static index.html (for GitHub Pages or any static host).
// Usage: node gen-static.mjs <silavu-page.html> <out dir> [public base URL for OG tags]
import fs from "node:fs";
import path from "node:path";
import { PIECES } from "./src/pieces.mjs";
const [src, outDir, base = "https://jonicoderx.github.io/isracard"] = process.argv.slice(2);
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
const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>SILAVU — Private high jewellery, Dubai &amp; Tel Aviv</title>
<meta name="description" content="SILAVU is a private jewellery house in Dubai and Tel Aviv. Diamonds graded by GIA or IGI, set by hand, one piece at a time — the Knot bracelet, the Desert Star, and commissions made to a single wrist. Viewings by appointment.">
<meta name="keywords" content="high jewellery Dubai, private jeweller Tel Aviv, bespoke diamond bracelet, GIA certified diamonds, tennis bracelet made to measure, SILAVU">
<link rel="canonical" href="${base}/">
<meta name="theme-color" content="#000000">
<meta name="silavu-build" content="${BUILD}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<meta name="author" content="SILAVU">
<meta name="format-detection" content="telephone=no">
<!-- one page, five languages, chosen in the browser: every locale is the same
     URL, so each alternate points here and x-default is the English default -->
<link rel="alternate" hreflang="en" href="${base}/">
<link rel="alternate" hreflang="he" href="${base}/">
<link rel="alternate" hreflang="fr" href="${base}/">
<link rel="alternate" hreflang="ar" href="${base}/">
<link rel="alternate" hreflang="ru" href="${base}/">
<link rel="alternate" hreflang="x-default" href="${base}/">
<meta property="og:locale" content="en_US">
<meta property="og:locale:alternate" content="he_IL">
<meta property="og:locale:alternate" content="fr_FR">
<meta property="og:locale:alternate" content="ar_AE">
<meta property="og:locale:alternate" content="ru_RU">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SILAVU">
<meta property="og:title" content="SILAVU — Private high jewellery, Dubai &amp; Tel Aviv">
<meta property="og:description" content="Diamonds graded by GIA or IGI, set by hand in Dubai, one piece at a time. The Knot, the Desert Star, and commissions made to a single wrist. Viewings by appointment.">
<meta property="og:image" content="${base}/og.jpg?v=7">
<meta property="og:image:secure_url" content="${base}/og.jpg?v=7">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The SILAVU mark in white on black, above the words Private high jewellery, Dubai and Tel Aviv">
<meta property="og:url" content="${base}/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="SILAVU — Private high jewellery, Dubai &amp; Tel Aviv">
<meta name="twitter:description" content="Diamonds graded by GIA or IGI, set by hand in Dubai, one piece at a time. Viewings by appointment.">
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
      "description": "A private high-jewellery house in Dubai and Tel Aviv. House collection, bespoke commissions and the SILAVU Line, by appointment.",
      "url": base + "/",
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
      "numberOfItems": PIECES.length,
      "itemListElement": PIECES.map(function (p, i) {
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
              "availability": "https://schema.org/InStock",
              "itemCondition": "https://schema.org/NewCondition",
              "availableAtOrFrom": { "@type": "Place", "name": "SILAVU Dubai" },
              "seller": { "@id": base + "/#house" },
              "description": "Price on request. Every piece is quoted to the stones it carries."
            }
          }
        };
      })
    },
    {
      "@type": "FAQPage",
      "@id": base + "/#faq",
      "mainEntity": [
        ["Where can I see a SILAVU piece?",
         "In Dubai or Tel Aviv, by appointment. A viewing is private — the pieces are brought out for you, and a piece that has to travel comes with a courier and an appraiser rather than in a parcel."],
        ["Are the diamonds certified?",
         "Every stone above the melee sizes is graded by GIA or IGI, and the report travels with the piece. You see the stones loose, under a loupe, before anything is set."],
        ["What does a bespoke commission involve?",
         "You bring an idea or a reference. The house sources the stones, draws the piece, and shows you both before the setter starts. Four to six weeks is usual for a bracelet; a large single stone takes as long as it takes to find."],
        ["Why is there no price on the site?",
         "Because the price is the stones. Two bracelets of the same design, one at E VS and one at G SI, are not the same object. Every piece is quoted to what it carries."]
      ].map(function (q) {
        return { "@type": "Question", "name": q[0], "acceptedAnswer": { "@type": "Answer", "text": q[1] } };
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
fs.writeFileSync(path.join(outDir, ".nojekyll"), "");
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
fs.writeFileSync(path.join(outDir, "sitemap.xml"),
  '<?xml version="1.0" encoding="UTF-8"?>\n'
  + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
  + "  <url>\n    <loc>" + base + "/</loc>\n"
  + ["en", "he", "fr", "ar", "ru"].map(function (l) {
      return '    <xhtml:link rel="alternate" hreflang="' + l + '" href="' + base + '/"/>\n';
    }).join("")
  + '    <xhtml:link rel="alternate" hreflang="x-default" href="' + base + '/"/>\n'
  + "    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n");
console.log("static index written:", path.join(outDir, "index.html"), ((head.length + html.length) / 1024).toFixed(0) + " KB");
