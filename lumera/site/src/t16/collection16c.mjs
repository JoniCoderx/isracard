/* /collection16c/ (proposal C, the house, 25 Nov 2026): "light in the dark". The whole collection on a night ground,
   like the collections' sky on the home page, the pieces kept in the dark of a vitrine until a light finds them: the
   pointer carries a soft spotlight that uncovers the house's own photograph and lets a highlight travel over the stones
   (a gradient over the picture; the jewellery itself is never redrawn, reshaped or recoloured). On a phone the piece at
   the centre of the screen comes into the light as the reader scrolls. A piece opens into a large preview (its
   photographs, its film when it has one, its facts and the two ways in) before its own page. Everything readable is in
   the HTML, with the same structured data as /collection14/. Only the house's own words and photographs. */
import fs from "node:fs";
import path from "node:path";
import { phoneMenu } from "../t14/phonemenu.mjs";

export function page({ PIECES, markDefs, markUse, root, base }) {
  const R = "../";
  const pm = phoneMenu(R, "collection16c/");
  /* the phone menu is shared with the test14 pages: here its links lead to this generation's pages */
  const PM = { css: pm.css, js: pm.js, html: pm.html.replace(/collection14\//g, "collection16c/").replace(/pieces14\//g, "pieces16/").replace(/test14\//g, "test15/") };
  const fontsDir = path.join(root, "public/fonts");
  const ff = re => fs.readdirSync(fontsDir).find(x => re.test(x));
  const heb = ff(/^(assistant|rubik)-normal-hebrew-[0-9a-f]{6}\.woff2$/);
  const jost = ff(/^jost-normal-latin-[0-9a-f]{6}\.woff2$/), jostx = ff(/^jost-normal-latin-ext-[0-9a-f]{6}\.woff2$/), urb = ff(/^urbanist-normal-all-[0-9a-f]{6}\.woff2$/);
  if (!jost || !jostx || !urb) return null;
  const q = v => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const plain = s => String(s).replace(/<[^>]+>/g, "");
  const E = (en, he) => `data-en="${q(en)}" data-he="${q(he || en)}"`;
  const EX = x => E(x.en, x.he);
  const shown = PIECES.filter(p => p.id && !p.exceptional && !p.preview);
  const sig = shown.filter(p => p.group !== "special"), sp = shown.filter(p => p.group === "special");
  const W = p => p.widths || [640, 900, 1254];
  const src = (img, p) => `${R}img/${img}-${W(p)[1] || W(p)[0]}.jpg`;
  const set = (img, p) => W(p).map(w => `${R}img/${img}-${w}.jpg ${w}w`).join(", ");
  const meta = p => (p.meta || []).filter(m => !/price/i.test(m.en)).map(m => `<li ${EX(m)}>${q(m.en)}</li>`).join("");
  const cats = [["all", "All", "הכל"], ["bracelets", "Bracelets", "צמידים"], ["rings", "Rings", "טבעות"], ["necklaces", "Necklaces", "שרשראות"], ["earrings", "Earrings", "עגילים"]].filter(([c]) => c === "all" || shown.some(p => p.cat === c));
  const page = id => `${R}pieces16/${q(id)}/`;

  /* one piece in the vitrine: the photograph under its veil of night, the light, the highlight, and the "View" */
  const card = (p, i, big) => { const a = p.shots[0];
    return `<article class="v16 ${big ? "big" : "small"}" data-cat="${q(p.cat)}" data-g="${big ? "sig" : "sp"}" id="${q(p.id)}" aria-labelledby="n-${q(p.id)}">
  <a class="lv" href="${page(p.id)}" data-open="${q(p.id)}" aria-label="${q(p.plain || plain(p.name.en))}" data-aria-he="${q(p.plainHe || plain(p.name.he || p.name.en))}">
    <span class="lvi">
      <img src="${src(a.img, p)}" srcset="${set(a.img, p)}" sizes="${big ? "(min-width: 900px) 46vw, 100vw" : "(min-width: 900px) 30vw, 80vw"}" width="1254" height="1254" loading="${i < 2 && big ? "eager" : "lazy"}" decoding="async" alt="${q(a.alt.en)}" data-alt-he="${q(a.alt.he || a.alt.en)}">
      <i class="dim" aria-hidden="true"></i><i class="veil" aria-hidden="true"></i><i class="glint" aria-hidden="true"></i>
    </span>
    <span class="vw" aria-hidden="true"><b ${E("View", "לצפייה")}>View</b></span>
  </a>
  <div class="ct">
    <p class="ck" ${EX(p.kind)}>${q(p.kind.en)}</p>
    <h3 class="cn" id="n-${q(p.id)}"><a href="${page(p.id)}" data-open="${q(p.id)}" ${EX(p.name)}>${p.name.en}</a></h3>
    <p class="cl" ${E(plain(p.line.en), plain(p.line.he || p.line.en))}>${q(plain(p.line.en))}</p>
    ${big ? `<ul class="cm">${meta(p)}</ul>` : ""}
  </div>
</article>`; };

  /* what the preview shows of each piece, all of it from pieces.mjs */
  const data = {};
  shown.forEach(p => { data[p.id] = {
    url: page(p.id).replace(/&amp;/g, "&"), w: W(p), kind: p.kind, name: p.name, line: { en: plain(p.line.en), he: plain(p.line.he || p.line.en) },
    key: (p.key || []).map(([k, v]) => [k, v]),
    price: ((p.specs || []).find(s => /price/i.test(s[0].en)) || [])[1] || null,
    shots: p.shots.map(s => ({ img: s.img, alt: s.alt })),
    film: p.film ? { src: R + p.film.src, poster: R + p.film.poster, alt: p.film.alt } : null }; });

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

  /* the night: a still sky of small stars, drawn once (no motion: the light is the only thing that moves) */
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = Array.from({ length: 70 }, () => { const x = (rnd() * 1000).toFixed(0), y = (rnd() * 1000).toFixed(0), r = (rnd() < .86 ? .5 + rnd() * .5 : 1 + rnd() * .5).toFixed(2), o = (.18 + rnd() * .5).toFixed(2), c = rnd() < .3 ? "#f4e7cc" : "#dfe7ff";
    return `<circle cx='${x}' cy='${y}' r='${r}' fill='${c}' fill-opacity='${o}'/>`; }).join("");
  const sky = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='1000' height='1000'>${stars}</svg>`).replace(/'/g, "%27")}")`;

  const css = fs.readFileSync(path.join(root, "src", "t16", "collection16c.css"), "utf8").replace("/*SKY*/", sky) + fs.readFileSync(path.join(root, "src", "t14", "header14.css"), "utf8");
  const js = `window.__c16=${JSON.stringify(data).replace(/</g, "\\u003c")};\n` + fs.readFileSync(path.join(root, "src", "t14", "lang14.js"), "utf8") + fs.readFileSync(path.join(root, "src", "t16", "collection16c.js"), "utf8");
  const og = base + "/img/" + sig[0].shots[0].img + "-1254.jpg";
  const A = (en, he) => `<span ${E(en, he)}>${en}</span>`;

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
<meta name="theme-color" content="#04060c">
<link rel="icon" href="${R}favicon.svg" type="image/svg+xml">
<link rel="preload" as="font" type="font/woff2" crossorigin href="${R}fonts/${jost}">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
<script>document.documentElement.classList.add("js");try{var l=localStorage.getItem("silavu-lang");if(l==="he"||l==="ar"){document.documentElement.lang=l;document.documentElement.dir="rtl";document.documentElement.setAttribute("data-ns","")}}catch(e){}</script>
<style>@font-face{font-family:'Jost';font-style:normal;font-weight:300 600;font-display:swap;src:url(${R}fonts/${jost}) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Jost';font-style:normal;font-weight:300 600;font-display:swap;src:url(${R}fonts/${jostx}) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
${heb ? `@font-face{font-family:'Silavu Hebrew';font-style:normal;font-weight:300 600;font-display:swap;src:url(${R}fonts/${heb}) format('woff2');unicode-range:U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F}` : ""}
@font-face{font-family:'Silavu Name';font-style:normal;font-weight:500;font-display:swap;src:url(${R}fonts/${urb}) format('woff2');unicode-range:U+41,U+49,U+4c,U+53,U+55-56,U+61,U+69,U+6c,U+73,U+75-76}
${css}${PM.css}
</style>
</head>
<body>
${markDefs()}
<header class="bar hx14">
  <nav class="tnav" aria-label="Main"><a href="${R}collection16c/" aria-current="page" data-en="Collection" data-he="קולקציה">Collection</a><a href="${R}test15/#build" data-en="Design yours" data-he="עצבו בעצמכם">Design yours</a><a href="${R}about14/" data-en="About" data-he="אודות">About</a></nav>
  <a class="back" href="${R}test15/" aria-label="SILAVU, back to the house"><span class="lk">${markUse("")}<span class="wm">SILAVU</span></span></a>
  <div class="barr"><a class="pill" href="${R}test15/?for=viewing#concierge" data-en="Book a private viewing" data-he="לתיאום פגישה פרטית">Book a private viewing</a><button class="lng" type="button" aria-label="עברית" data-en="EN" data-he="עב">EN</button></div>
</header>
${PM.html}
<i class="torch" aria-hidden="true"></i>
<main class="night">
  <section class="nh" aria-labelledby="ch">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="${R}test15/">SILAVU</a><i aria-hidden="true">/</i><span aria-current="page" ${E("The collection", "הקולקציה")}>The collection</span></nav>
    <h1 id="ch"><span class="h1a" ${E("The", "קולקציית")}>The</span> <span class="h1b">SILAVU</span> <em class="h1c" data-en="collection" data-he="">collection</em></h1>
    <p class="chl" ${E("Diamond bracelets, rings, necklaces and earrings in 18K gold, each signed by SILAVU and made to order by hand in Dubai.", "צמידים, טבעות, שרשראות ועגילים של יהלומים בזהב 18K, כל אחד חתום SILAVU ומיוצר לפי הזמנה בעבודת יד בדובאי.")}>Diamond bracelets, rings, necklaces and earrings in 18K gold, each signed by SILAVU and made to order by hand in Dubai.</p>
    <p class="hint" aria-hidden="true"><i></i><span class="hp" ${E("Bring the light to a piece", "הביאו את האור אל תכשיט")}>Bring the light to a piece</span><span class="ht" ${E("Scroll, and each piece comes into the light", "גללו, וכל תכשיט יוצא אל האור")}>Scroll, and each piece comes into the light</span></p>
    <div class="chf" role="toolbar" aria-label="Show">${cats.map(([c, n, nh], i) => `<button type="button" class="chip${i ? "" : " on"}" data-f="${c}" aria-pressed="${i ? "false" : "true"}" ${E(n, nh)}>${n}</button>`).join("")}</div>
  </section>

  <section class="vit" aria-label="The pieces">
    <h2 class="gk" data-g="sig" ${E("The Signature", "החתימה")}>The Signature</h2>
    ${sig.map((p, i) => card(p, i, true)).join("\n")}
    ${sp.length ? `<h2 class="gk" data-g="sp" ${E("Special pieces", "תכשיטים מיוחדים")}>Special pieces</h2>
    ${sp.map((p, i) => card(p, i, false)).join("\n")}` : ""}
  </section>

  <section class="mk16" aria-labelledby="mkh">
    ${markUse("mkmk")}
    <h2 id="mkh" ${E("Or one made <em>only for you.</em>", "או אחד שנוצר <em>רק בשבילכם.</em>")}>Or one made <em>only for you.</em></h2>
    <p ${E("Choose the stones, the carat, the size and the metal, and see your bracelet take shape before it is made.", "בחרו את האבנים, הקראט, המידה והמתכת, וראו את הצמיד שלכם מקבל צורה עוד לפני שהוא נוצר.")}>Choose the stones, the carat, the size and the metal, and see your bracelet take shape before it is made.</p>
    <div class="mka"><a class="go" href="${R}test15/#build">${A("Design your bracelet", "עצבו צמיד")}</a><a class="lnk" href="${R}test15/?for=viewing#concierge" ${E("Book a private viewing", "לתיאום פגישה פרטית")}>Book a private viewing</a></div>
  </section>
</main>
<footer class="foot"><span ${E("© SILAVU 2026 · Dubai · Tel Aviv · By appointment", "© SILAVU 2026 · דובאי · תל אביב · בתיאום מראש")}>© SILAVU 2026 · Dubai · Tel Aviv · By appointment</span><a href="${R}test15/" ${E("Back to the house", "חזרה לבית")}>Back to the house</a></footer>

<dialog class="pv" id="pv" aria-labelledby="pvn">
  <div class="pvin">
    <button class="pvx" type="button" aria-label="Close" data-he-label="סגירה"></button>
    <div class="pvst">
      <ul class="pvsl" tabindex="-1"></ul>
      <button class="pva prev" type="button" aria-label="Previous" data-he-label="הקודם"></button><button class="pva next" type="button" aria-label="Next" data-he-label="הבא"></button>
      <div class="pvth"></div>
    </div>
    <div class="pvtx">
      <p class="pvk"></p>
      <h2 class="pvn" id="pvn"></h2>
      <p class="pvl"></p>
      <dl class="pvkey"></dl>
      <p class="pvp"></p>
      <div class="pvact"><a class="go pvgo" href="#">${A("View the piece", "לצפייה בתכשיט")}</a><a class="lnk" href="${R}test15/?for=viewing#concierge" ${E("Book a private viewing", "לתיאום פגישה פרטית")}>Book a private viewing</a></div>
    </div>
  </div>
</dialog>
<script>${js}</script><script>${PM.js}</script>
</body>
</html>
`;
}
