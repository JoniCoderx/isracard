/* /collection14/: the whole SILAVU collection, in /test14/'s black (the house's note of 4 Nov 2026: "the page of the
   collection needs to be designed amazing and fit in good SEO").
   One h1 that says what the house makes and where; the four Signature pieces as large chapters (the worn photograph,
   the piece on its own on hover, a loupe, the line about it, its facts and the two ways in); the special pieces as a
   row of large cards; the builder and a private viewing at the end. Filters by kind. Everything is in the HTML, so a
   search engine reads the whole collection without running a script, and the page carries its own structured data:
   a CollectionPage holding an ItemList of the Products, and the breadcrumb. Only the house's own words and photographs. */
import fs from "node:fs";
import path from "node:path";

export function collection14Page({ PIECES, markDefs, markUse, root, base }) {
  const R = "../";
  const fontsDir = path.join(root, "public/fonts");
  const ff = re => fs.readdirSync(fontsDir).find(x => re.test(x));
  const jost = ff(/^jost-normal-latin-[0-9a-f]{6}\.woff2$/), jostx = ff(/^jost-normal-latin-ext-[0-9a-f]{6}\.woff2$/), urb = ff(/^urbanist-normal-all-[0-9a-f]{6}\.woff2$/);
  if (!jost || !jostx || !urb) return null;
  const q = v => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const plain = s => String(s).replace(/<[^>]+>/g, "");
  const shown = PIECES.filter(p => p.id && !p.exceptional && !p.preview);
  const sig = shown.filter(p => p.group !== "special"), sp = shown.filter(p => p.group === "special");
  const W = p => p.widths || [640, 900, 1254];
  const src = (img, p) => `${R}img/${img}-${W(p)[1] || W(p)[0]}.jpg`;
  const set = (img, p) => W(p).map(w => `${R}img/${img}-${w}.jpg ${w}w`).join(", ");
  const worn = p => (p.shots.find(s => /-worn$/.test(s.img)) || p.shots[1] || p.shots[0]);
  const meta = p => (p.meta || []).filter(m => !/price/i.test(m.en)).map(m => `<li>${q(m.en)}</li>`).join("");
  const cats = [["all", "All"], ["bracelets", "Bracelets"], ["rings", "Rings"], ["necklaces", "Necklaces"], ["earrings", "Earrings"]].filter(([c]) => c === "all" || shown.some(p => p.cat === c));

  const chapter = (p, i) => { const a = worn(p), b = p.shots[0];
    return `<article class="cc14 ${i % 2 ? "flip" : ""}" data-cat="${q(p.cat)}" id="${q(p.id)}" aria-labelledby="n-${q(p.id)}">
  <a class="ccpic" href="${R}pieces/${q(p.id)}/" aria-label="${q(p.plain || plain(p.name.en))}">
    <img class="a" src="${src(a.img, p)}" srcset="${set(a.img, p)}" sizes="(min-width: 900px) 56vw, 100vw" width="1254" height="1254" loading="${i < 1 ? "eager" : "lazy"}" decoding="async" alt="${q(a.alt.en)}">
    <img class="b" src="${src(b.img, p)}" srcset="${set(b.img, p)}" sizes="(min-width: 900px) 56vw, 100vw" width="1254" height="1254" loading="lazy" decoding="async" alt="${q(b.alt.en)}">
  </a>
  <div class="cctxt">
    <p class="cck">${q(p.kind.en)}</p>
    <h3 class="ccn" id="n-${q(p.id)}">${p.name.en}</h3>
    <p class="ccl">${q(plain(p.line.en))}</p>
    <ul class="ccm">${meta(p)}</ul>
    <div class="cca"><a class="ccgo" href="${R}pieces/${q(p.id)}/">View the piece</a><a class="ccres" href="${R}test14/#concierge">Book a private viewing</a></div>
  </div>
</article>`; };
  const special = p => { const a = p.shots[0];
    return `<li class="sp14" data-cat="${q(p.cat)}"><a href="${R}pieces/${q(p.id)}/">
  <span class="sppic"><img src="${src(a.img, p)}" srcset="${set(a.img, p)}" sizes="(min-width: 900px) 30vw, 90vw" width="1254" height="1254" loading="lazy" decoding="async" alt="${q(a.alt.en)}"></span>
  <span class="spk">${q(p.kind.en)}</span><span class="spn">${p.name.en}</span><span class="spl">${q(plain(p.line.en))}</span></a></li>`; };

  const title = "Diamond Jewellery Collection · Bracelets, Rings, Necklaces & Earrings | SILAVU";
  const desc = "Diamond bracelets, rings, necklaces and earrings in 18K gold, signed by SILAVU and made to order by hand in Dubai. Seen in private, by appointment.";
  const url = base + "/collection/";
  const items = shown.map((p, i) => ({ "@type": "ListItem", "position": i + 1, "url": base + "/pieces/" + p.id + "/",
    "item": { "@type": "Product", "name": p.plain || plain(p.name.en), "url": base + "/pieces/" + p.id + "/", "image": base + "/img/" + p.shots[0].img + "-" + W(p).slice(-1)[0] + ".jpg",
      "description": plain(p.line.en), "category": p.cat, "brand": { "@type": "Brand", "name": "SILAVU" } } }));
  const schema = { "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", "@id": url + "#page", "url": url, "name": "The SILAVU collection", "description": desc, "inLanguage": "en",
      "isPartOf": { "@type": "WebSite", "name": "SILAVU", "url": base + "/" }, "mainEntity": { "@type": "ItemList", "numberOfItems": shown.length, "itemListElement": items } },
    { "@type": "BreadcrumbList", "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "SILAVU", "item": base + "/" },
      { "@type": "ListItem", "position": 2, "name": "The collection", "item": url } ] } ] };
  const css = fs.readFileSync(path.join(root, "src", "t14", "collection14.css"), "utf8");
  const js = fs.readFileSync(path.join(root, "src", "t14", "collection14.js"), "utf8");
  const og = base + "/img/" + worn(sig[0]).img + "-1254.jpg";

  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${q(title)}</title>
<meta name="description" content="${q(desc)}">
<meta name="robots" content="noindex,nofollow">
<link rel="canonical" href="${q(url)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="SILAVU"><meta property="og:title" content="${q(title)}"><meta property="og:description" content="${q(desc)}"><meta property="og:url" content="${q(url)}"><meta property="og:image" content="${q(og)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#000000">
<link rel="icon" href="${R}favicon.svg" type="image/svg+xml">
<link rel="preload" as="font" type="font/woff2" crossorigin href="${R}fonts/${jost}">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
<script>document.documentElement.classList.add("js")</script>
<style>@font-face{font-family:'Jost';font-style:normal;font-weight:300 600;font-display:swap;src:url(${R}fonts/${jost}) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Jost';font-style:normal;font-weight:300 600;font-display:swap;src:url(${R}fonts/${jostx}) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Silavu Name';font-style:normal;font-weight:500;font-display:swap;src:url(${R}fonts/${urb}) format('woff2');unicode-range:U+41,U+49,U+4c,U+53,U+55-56,U+61,U+69,U+6c,U+73,U+75-76}
${css}</style>
</head>
<body>
${markDefs()}
<header class="bar">
  <a class="back" href="${R}test14/" aria-label="SILAVU, back to the house">${markUse("")}<span class="wm">SILAVU</span></a>
  <nav class="tnav" aria-label="Main"><a href="${R}test14/#build">Design your bracelet</a><a href="${R}about14/">About</a></nav>
  <a class="pill" href="${R}test14/#concierge">Book a private viewing</a>
</header>
<main>
  <section class="ch14" aria-labelledby="ch">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="${R}test14/">SILAVU</a><i aria-hidden="true">/</i><span aria-current="page">The collection</span></nav>
    ${markUse("chmk")}
    <h1 id="ch">The SILAVU <em>collection</em></h1>
    <p class="chl">Diamond bracelets, rings, necklaces and earrings in 18K gold, each signed by SILAVU and made to order by hand in Dubai.</p>
    <div class="chf" role="toolbar" aria-label="Show">${cats.map(([c, n], i) => `<button type="button" class="chip${i ? "" : " on"}" data-f="${c}" aria-pressed="${i ? "false" : "true"}">${n}</button>`).join("")}</div>
  </section>

  <section class="sig14" aria-labelledby="sh">
    <h2 class="k14" id="sh">The Signature</h2>
    ${sig.map(chapter).join("\n")}
  </section>

  ${sp.length ? `<section class="spc14" aria-labelledby="ph">
    <h2 class="k14" id="ph">Special pieces</h2>
    <ul class="spgrid">${sp.map(special).join("")}</ul>
  </section>` : ""}

  <section class="mk14" aria-labelledby="mkh">
    ${markUse("mkmk")}
    <h2 id="mkh">Or one made <em>only for you.</em></h2>
    <p>Choose the stones, the carat, the size and the metal, and see your bracelet take shape before it is made.</p>
    <div class="mka"><a class="c14all" href="${R}test14/#build"><span class="c14allmk" aria-hidden="true">${markUse("")}</span><span>Design your bracelet</span><i class="c14allar" aria-hidden="true"></i></a><a class="lnk" href="${R}test14/#concierge">Book a private viewing</a></div>
  </section>
</main>
<footer class="foot"><span>© SILAVU 2026 · Dubai · Tel Aviv · By appointment</span><a href="${R}test14/">Back to the house</a></footer>
<script>${js}</script>
</body>
</html>
`;
}
