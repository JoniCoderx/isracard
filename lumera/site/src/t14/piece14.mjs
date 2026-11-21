/* /pieces14/<id>/: one piece of the collection, in /test14/'s black (the house, 15 Nov 2026: "when you press a product
   it takes you to the old pages"). Everything on the page is the house's own: the photographs and the film of the
   piece, its line, its story, its facts and its specification, as they stand in pieces.mjs. Nothing is added: no price,
   no review, no figure the house has not confirmed. English and Hebrew are both in the page; it opens in the language
   the reader chose on /test14/ (silavu-lang) and has its own switch. */
import fs from "node:fs";
import path from "node:path";
import { phoneMenu } from "./phonemenu.mjs";

export function piece14Pages({ PIECES, markDefs, markUse, root, base }) {
  const R = "../../";
  const fontsDir = path.join(root, "public/fonts");
  const ff = re => fs.readdirSync(fontsDir).find(x => re.test(x));
  const jost = ff(/^jost-normal-latin-[0-9a-f]{6}\.woff2$/), jostx = ff(/^jost-normal-latin-ext-[0-9a-f]{6}\.woff2$/), urb = ff(/^urbanist-normal-all-[0-9a-f]{6}\.woff2$/);
  const heb = ff(/^(assistant|rubik)-normal-hebrew-[0-9a-f]{6}\.woff2$/);
  if (!jost || !jostx || !urb) return null;
  const q = v => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const plain = s => String(s).replace(/<[^>]+>/g, "");
  /* a text in both languages: English in the page, Hebrew beside it for the switch */
  const T = (x, tag = "span", cls = "") => x ? `<${tag}${cls ? ` class="${cls}"` : ""} data-en="${q(x.en)}" data-he="${q(x.he || x.en)}">${x.en}</${tag}>` : "";
  const TA = x => `alt="${q(x.en)}" data-alt-he="${q(x.he || x.en)}"`;
  const S = (en, he) => ({ en, he });
  const shown = PIECES.filter(p => p.id && !p.exceptional && !p.preview);
  const W = p => p.widths || [640, 900, 1254];
  const img = (sh, p, sizes, eager) => `<img src="${R}img/${sh.img}-${W(p)[1] || W(p)[0]}.jpg" srcset="${W(p).map(w => `${R}img/${sh.img}-${w}.jpg ${w}w`).join(", ")}" sizes="${sizes}" width="1254" height="1254" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" ${TA(sh.alt)}>`;
  const css = fs.readFileSync(path.join(root, "src", "t14", "collection14.css"), "utf8") + fs.readFileSync(path.join(root, "src", "t14", "header14.css"), "utf8") + fs.readFileSync(path.join(root, "src", "t14", "piece14.css"), "utf8");
  const js = fs.readFileSync(path.join(root, "src", "t14", "piece14.js"), "utf8") + fs.readFileSync(path.join(root, "src", "t14", "lang14.js"), "utf8");
  const PM = phoneMenu(R, "");

  return shown.map(p => {
    const url = base + "/pieces/" + p.id + "/";
    const others = shown.filter(o => o !== p);
    const slides = [];
    if (p.film) slides.push(`<li class="pps film" data-i="0"><video muted loop playsinline preload="none" poster="${R}${q(p.film.poster)}" data-src="${R}${q(p.film.src)}.mp4" data-src-sm="${R}${q(p.film.src)}-720.mp4" aria-label="${q(p.film.alt.en)}" data-alt-he="${q(p.film.alt.he || p.film.alt.en)}"></video></li>`);
    p.shots.forEach((sh, i) => slides.push(`<li class="pps" data-i="${slides.length}"><button type="button" class="ppz" aria-label="Enlarge" data-he-label="הגדלה">${img(sh, p, "(min-width: 900px) 56vw, 100vw", i === 0 && !p.film)}</button></li>`));
    const thumbs = (p.film ? [{ film: true }] : []).concat(p.shots).map((sh, i) => `<button type="button" class="ppt${i ? "" : " on"}" data-i="${i}" aria-label="${i + 1}">${sh.film
      ? `<img src="${R}${q(p.film.poster)}" alt="" loading="lazy" decoding="async"><i class="ppplay" aria-hidden="true"></i>`
      : `<img src="${R}img/${sh.img}-${W(p)[0]}.jpg" alt="" loading="lazy" decoding="async">`}</button>`).join("");
    const keys = (p.key || []).map(([k, v]) => `<div>${T(k, "dt")}${T(v, "dd")}</div>`).join("");
    const specs = (p.specs || []).map(([k, v]) => `<div>${T(k, "dt")}${T(v, "dd")}</div>`).join("");
    const card = o => `<li><a href="${R}pieces14/${q(o.id)}/"><span class="pmpic">${img(o.shots[0], o, "(min-width: 900px) 22vw, 60vw")}</span>${T(o.kind, "span", "pmk")}${T(o.name, "span", "pmn")}</a></li>`;
    const bracelet = p.cat === "bracelets";
    const schema = { "@context": "https://schema.org", "@graph": [
      { "@type": "Product", "@id": url + "#product", "name": p.plain || plain(p.name.en), "url": url, "sku": (p.specs || []).map(s => s[1].en).find(v => /^SLV/.test(v)) || undefined,
        "image": p.shots.map(s => base + "/img/" + s.img + "-" + W(p).slice(-1)[0] + ".jpg"), "description": plain(p.line.en), "category": p.cat, "brand": { "@type": "Brand", "name": "SILAVU" } },
      { "@type": "BreadcrumbList", "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "SILAVU", "item": base + "/" },
        { "@type": "ListItem", "position": 2, "name": "The collection", "item": base + "/collection/" },
        { "@type": "ListItem", "position": 3, "name": p.plain || plain(p.name.en), "item": url } ] } ] };
    const title = (p.title && p.title.en) || (p.plain || plain(p.name.en)) + " | SILAVU";
    const desc = plain(p.line.en);
    const html = `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${q(title)}</title>
<meta name="description" content="${q(desc)}">
<meta name="robots" content="noindex,nofollow">
<link rel="canonical" href="${q(url)}">
<meta property="og:type" content="product"><meta property="og:site_name" content="SILAVU"><meta property="og:title" content="${q(title)}"><meta property="og:description" content="${q(desc)}"><meta property="og:url" content="${q(url)}"><meta property="og:image" content="${q(base + "/img/" + p.shots[0].img + "-1254.jpg")}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#000000">
<link rel="icon" href="${R}favicon.svg" type="image/svg+xml">
<link rel="preload" as="font" type="font/woff2" crossorigin href="${R}fonts/${jost}">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
<script>document.documentElement.classList.add("js");try{var l=localStorage.getItem("silavu-lang");if(l==="he"||l==="ar"){document.documentElement.lang=l;document.documentElement.dir="rtl";document.documentElement.setAttribute("data-ns","")}}catch(e){}</script>
<style>@font-face{font-family:'Jost';font-style:normal;font-weight:300 600;font-display:swap;src:url(${R}fonts/${jost}) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Jost';font-style:normal;font-weight:300 600;font-display:swap;src:url(${R}fonts/${jostx}) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
${heb ? `@font-face{font-family:'Silavu Hebrew';font-style:normal;font-weight:300 600;font-display:swap;src:url(${R}fonts/${heb}) format('woff2');unicode-range:U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F}` : ""}
@font-face{font-family:'Silavu Name';font-style:normal;font-weight:500;font-display:swap;src:url(${R}fonts/${urb}) format('woff2');unicode-range:U+41,U+49,U+4c,U+53,U+55-56,U+61,U+69,U+6c,U+73,U+75-76}
${css}${PM.css.replace(/pieces\//g, "pieces14/")}
</style>
</head>
<body>
${markDefs()}
<header class="bar hx14">
  <nav class="tnav" aria-label="Main"><a href="${R}collection14/" aria-current="page" data-en="Collection" data-he="קולקציה">Collection</a><a href="${R}test14/#build" data-en="Design yours" data-he="עצבו בעצמכם">Design yours</a><a href="${R}about14/" data-en="About" data-he="אודות">About</a></nav>
  <a class="back" href="${R}test14/" aria-label="SILAVU, back to the house"><span class="lk">${markUse("")}<span class="wm">SILAVU</span></span></a>
  <div class="barr"><a class="pill" href="${R}test14/?for=viewing#concierge" data-en="Book a private viewing" data-he="לתיאום פגישה פרטית">Book a private viewing</a><button class="lng" type="button" aria-label="עברית" data-en="EN" data-he="עב">EN</button></div>
</header>
${PM.html.replace(/pieces\//g, "pieces14/")}
<main class="pp14">
  <section class="pphero" aria-labelledby="pn">
    <div class="ppg" aria-roledescription="carousel" aria-label="${q(p.plain || plain(p.name.en))}">
      <ul class="pptrack" tabindex="0">${slides.join("")}</ul>
      <button class="ppar prev" type="button" aria-label="Previous"></button><button class="ppar next" type="button" aria-label="Next"></button>
      <span class="ppn" aria-hidden="true"><b>1</b> / ${slides.length}</span>
      <div class="ppthumbs">${thumbs}</div>
    </div>
    <div class="ppinfo">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="${R}test14/">SILAVU</a><i aria-hidden="true">/</i><a href="${R}collection14/" data-en="Collection" data-he="קולקציה">Collection</a><i aria-hidden="true">/</i>${T(p.kind)}</nav>
      ${T(p.kind, "p", "cck")}
      ${T(p.name, "h1", "ppname").replace("<h1", '<h1 id="pn"')}
      ${T(p.line, "p", "ccl")}
      <dl class="ppkey">${keys}</dl>
      <div class="cca">
        <a class="ccgo" href="${R}test14/?for=viewing#concierge" data-en="Book a private viewing" data-he="לתיאום פגישה פרטית">Book a private viewing</a>
        ${bracelet ? `<a class="lnk" href="${R}test14/#build" data-en="Or design your own bracelet" data-he="או עצבו צמיד משלכם">Or design your own bracelet</a>` : `<a class="lnk" href="${R}collection14/" data-en="The whole collection" data-he="כל הקולקציה">The whole collection</a>`}
      </div>
      ${T(S("Price on request · Made to order · Seen in private, by appointment", "מחיר לפי בקשה · מיוצר לפי הזמנה · בפגישה פרטית, בתיאום מראש"), "p", "ppnote")}
    </div>
  </section>

  ${p.story ? `<section class="ppstory" aria-label="The story">
    ${markUse("ppmk")}
    ${T(p.story, "p")}
  </section>` : ""}

  ${specs ? `<section class="ppspec" aria-labelledby="sph">
    <h2 class="k14" id="sph" data-en="The details" data-he="הפרטים">The details</h2>
    <dl>${specs}</dl>
  </section>` : ""}

  <section class="ppmore" aria-labelledby="mh">
    <h2 class="k14" id="mh" data-en="Also in the collection" data-he="עוד בקולקציה">Also in the collection</h2>
    <ul style="--n:${others.length}">${others.map(card).join("")}</ul>
  </section>
</main>
<div class="ppbox" role="dialog" aria-modal="true" aria-label="Enlarged" hidden><img alt=""><button class="ppx" type="button" aria-label="Close"></button><button class="ppar prev" type="button" aria-label="Previous"></button><button class="ppar next" type="button" aria-label="Next"></button></div>
<footer class="foot"><span data-en="© SILAVU 2026 · Dubai · Tel Aviv · By appointment" data-he="© SILAVU 2026 · דובאי · תל אביב · בתיאום מראש">© SILAVU 2026 · Dubai · Tel Aviv · By appointment</span><a href="${R}collection14/" data-en="Back to the collection" data-he="חזרה לקולקציה">Back to the collection</a></footer>
<script>${js}</script><script>${PM.js}</script>
</body>
</html>
`;
    return { id: p.id, html };
  });
}
