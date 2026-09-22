// Turn silavu-page.html into a self-contained static index.html (for GitHub Pages or any static host).
// Usage: node gen-static.mjs <silavu-page.html> <out dir> [public base URL for OG tags]
import fs from "node:fs";
import path from "node:path";
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
<title>SILAVU — High jewellery, Dubai · Tel Aviv</title>
<meta name="description" content="A private high-jewellery house in Dubai and Tel Aviv. The SILAVU Line, bespoke pieces, private viewings by appointment.">
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
<meta property="og:title" content="SILAVU — Private high jewellery, Dubai · Tel Aviv">
<meta property="og:description" content="A private high-jewellery house in Dubai and Tel Aviv. The SILAVU Line, bespoke pieces, private viewings by appointment.">
<meta property="og:image" content="${base}/og.jpg?v=6">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${base}/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="SILAVU — Private high jewellery, Dubai · Tel Aviv">
<meta name="twitter:image" content="${base}/og.jpg?v=6">
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
    {
      "@type": "ItemList",
      "name": "The Monogram",
      "itemListOrder": "https://schema.org/ItemListOrderAscending",
      "numberOfItems": 4,
      "itemListElement": [
        ["Monogram Pendant", "The house mark in pave diamonds on a fine white gold chain.", "1.85 ct, 18K white gold", base + "/img/mono-neck-1600.jpg"],
        ["Monogram Bracelet", "The house mark repeated and interlaced around the wrist.", "4.20 ct, 18K white gold", base + "/img/mono-wrist-1600.jpg"],
        ["Monogram Ear cuff", "The house mark following the curve of the ear.", "1.10 ct, 18K white gold", base + "/img/mono-ear-1600.jpg"],
        ["The Desert Star", "An eighteen carat brilliant in a radiating halo. Made once.", "18.06 ct, platinum", base + "/img/star-worn-1600.jpg"]
      ].map(function (p, i) {
        return {
          "@type": "ListItem", "position": i + 1,
          "item": {
            "@type": "Product", "name": p[0], "description": p[1], "material": p[2], "image": p[3],
            "brand": { "@id": base + "/#house" },
            "offers": { "@type": "Offer", "availability": "https://schema.org/InStock", "priceCurrency": "AED", "price": "0", "priceSpecification": { "@type": "PriceSpecification", "valueAddedTaxIncluded": true }, "seller": { "@id": base + "/#house" }, "description": "Price on request" }
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
