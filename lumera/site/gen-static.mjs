// Turn silavu-page.html into a self-contained static index.html (for GitHub Pages or any static host).
// Usage: node gen-static.mjs <silavu-page.html> <out dir> [public base URL for OG tags]
import fs from "node:fs";
import path from "node:path";
const [src, outDir, base = "https://jonicoderx.github.io/isracard"] = process.argv.slice(2);
let html = fs.readFileSync(src, "utf8").replace(/<title>[\s\S]*?<\/title>/, "").replace(/<meta name="viewport"[^>]*>\s*/g, "").replace(/<meta charset=[^>]*>\s*/gi, "");
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
<meta name="theme-color" content="#000000">
<meta name="silavu-build" content="${BUILD}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SILAVU">
<meta property="og:title" content="SILAVU — Private high jewellery, Dubai · Tel Aviv">
<meta property="og:description" content="A private high-jewellery house in Dubai and Tel Aviv. The SILAVU Line, bespoke pieces, private viewings by appointment.">
<meta property="og:image" content="${base}/og.jpg?v=4">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${base}/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="SILAVU — Private high jewellery, Dubai · Tel Aviv">
<meta name="twitter:image" content="${base}/og.jpg?v=4">
<link rel="icon" href="favicon.ico?v=4" sizes="48x48 32x32 16x16">
<link rel="icon" href="icon-32.png?v=4" type="image/png" sizes="32x32">
<link rel="icon" href="icon-16.png?v=4" type="image/png" sizes="16x16">
<link rel="icon" href="favicon.svg?v=4" type="image/svg+xml" sizes="any">
<link rel="apple-touch-icon" href="icon-180.png?v=4" sizes="180x180">
<link rel="manifest" href="site.webmanifest?v=4">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="image" href="img/hero-2560.jpg" media="(min-width: 900px)">
<link rel="preload" as="image" href="img/herov-1440.jpg" media="(max-width: 899px)">
<script>window.__silavuBuild="${BUILD}";</script>
</head>
<body>
`;
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "index.html"), head + html + "\n</body>\n</html>\n");
fs.writeFileSync(path.join(outDir, ".nojekyll"), "");
console.log("static index written:", path.join(outDir, "index.html"), ((head.length + html.length) / 1024).toFixed(0) + " KB");
