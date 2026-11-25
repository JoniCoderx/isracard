/* /pieces16/<id>/: one piece of the collection, made far more seductive (the house, 25 Nov 2026: the product page must be
   "sexier"). A slow, cinematic page in the manner of a fashion house: it opens full-bleed on the worn photograph, cropped
   close, the name large and quiet over it; then the piece alone on black (its film, muted, looping, only while seen),
   its story in large lines, a close-up that can be explored (a loupe under the pointer, a tap to look closer on a
   phone), its facts and specification as a precise table, every photograph with a full-screen viewer, and the other
   pieces at the end. A slim bar keeps the private viewing within a thumb's reach.
   Everything is the house's own, as it stands in pieces.mjs: photographs, film, line, story, facts, specification.
   No price, no review, no claim the house has not made. English and Hebrew are both in the page (lang14.js). */
import fs from "node:fs";
import path from "node:path";
import { phoneMenu } from "../t14/phonemenu.mjs";

/* where each photograph's subject sits, so a close, tall crop on a phone keeps the piece in frame (x% y%) */
const FOCUS = {
  "knot-worn": "58% 52%", "ring-worn": "36% 54%", "necklace-worn": "20% 72%", "aura-worn": "56% 42%",
  "cadence-worn": "54% 64%", "blush-worn": "44% 46%", "promise-macro": "48% 50%",
};

export function pages({ PIECES, markDefs, markUse, root, base }) {
  const R = "../../";
  const fontsDir = path.join(root, "public/fonts");
  const ff = re => fs.readdirSync(fontsDir).find(x => re.test(x));
  const jost = ff(/^jost-normal-latin-[0-9a-f]{6}\.woff2$/), jostx = ff(/^jost-normal-latin-ext-[0-9a-f]{6}\.woff2$/), urb = ff(/^urbanist-normal-all-[0-9a-f]{6}\.woff2$/);
  const heb = ff(/^(assistant|rubik)-normal-hebrew-[0-9a-f]{6}\.woff2$/);
  if (!jost || !jostx || !urb) return null;
  const q = v => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const plain = s => String(s).replace(/<[^>]+>/g, "");
  const T = (x, tag = "span", cls = "", attrs = "") => x ? `<${tag}${cls ? ` class="${cls}"` : ""}${attrs} data-en="${q(x.en)}" data-he="${q(x.he || x.en)}">${x.en}</${tag}>` : "";
  const TA = x => `alt="${q(x.en)}" data-alt-he="${q(x.he || x.en)}"`;
  const S = (en, he) => ({ en, he });
  const shown = PIECES.filter(p => p.id && !p.exceptional && !p.preview);
  const W = p => p.widths || [640, 900, 1254];
  const src = (sh, p, w) => `${R}img/${sh.img}-${w}.jpg`;
  const set = (sh, p) => W(p).map(w => `${src(sh, p, w)} ${w}w`).join(", ");
  const big = p => W(p).slice(-1)[0];
  const img = (sh, p, sizes, opt = {}) => `<img src="${src(sh, p, W(p)[1] || W(p)[0])}" srcset="${set(sh, p)}" sizes="${sizes}" width="1254" height="1254"${opt.eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"${opt.cls ? ` class="${opt.cls}"` : ""}${opt.style ? ` style="${opt.style}"` : ""} ${opt.noalt ? 'alt=""' : TA(sh.alt)}>`;
  const find = (p, re) => p.shots.find(s => re.test(s.img));
  const css = fs.readFileSync(path.join(root, "src", "t14", "collection14.css"), "utf8") + fs.readFileSync(path.join(root, "src", "t14", "header14.css"), "utf8") + fs.readFileSync(path.join(root, "src", "t16", "piece16.css"), "utf8");
  const js = fs.readFileSync(path.join(root, "src", "t16", "piece16.js"), "utf8") + fs.readFileSync(path.join(root, "src", "t14", "lang14.js"), "utf8");
  const PM = phoneMenu(R, "collection14/");
  const fix = s => s.replace(/pieces14\//g, "pieces16/").replace(/test14\//g, "test15/");
  const VIEW = `${R}test15/?for=viewing#concierge`, ENQ = `${R}test15/#concierge`;
  /* a story, said line by line: split at the end of each sentence (the house's own words, nothing added) */
  const lines = x => { const en = x.en.split(/(?<=[.:])\s+/), he = (x.he || x.en).split(/(?<=[.:])\s+/);
    return en.length === he.length ? en.map((e, i) => S(e, he[i])) : [x]; };

  return shown.map(p => {
    const url = base + "/pieces/" + p.id + "/";
    const name = p.plain || plain(p.name.en);
    const word = plain(p.name.en).replace(/^SILAVU\s*/, "");
    const worn = find(p, /-worn$/);
    const hero = worn || find(p, /-macro$/) || p.shots[0];
    const macro = (hero.img.endsWith("-macro") ? null : find(p, /-macro$/)) || p.shots.find(s => s !== hero && !/-worn$/.test(s.img)) || p.shots[0];
    const alone = p.shots.find(s => s !== hero && s !== macro && !/-worn$/.test(s.img)) || p.shots[0];
    const sig = shown.filter(o => o.group !== "special" && o !== p), sp = shown.filter(o => o.group === "special" && o !== p);
    const bracelet = p.cat === "bracelets";
    const focus = FOCUS[hero.img] || "50% 50%";

    const keys = (p.key || []).map(([k, v]) => `<div>${T(k, "dt")}${T(v, "dd")}</div>`).join("");
    const specs = (p.specs || []).map(([k, v]) => `<tr${/^Price$/.test(k.en) ? ' class="pr"' : ""}>${T(k, "th", "", ' scope="row"')}${T(v, "td")}</tr>`).join("");
    const story = p.story ? lines(p.story).map(l => T(l, "span", "ln")).join(" ") : "";
    const gal = p.shots.map((sh, i) => `<li${i === 0 ? ' class="g1"' : ""}><button type="button" class="gz" data-i="${i}" aria-label="Open photograph ${i + 1} of ${p.shots.length}" data-he-label="פתיחת תמונה ${i + 1} מתוך ${p.shots.length}">${img(sh, p, i === 0 ? "(min-width: 900px) 46vw, 100vw" : "(min-width: 900px) 24vw, 50vw")}</button></li>`).join("");
    const vdata = JSON.stringify(p.shots.map(sh => ({ s: src(sh, p, big(p)), m: src(sh, p, W(p)[1] || W(p)[0]), en: sh.alt.en, he: sh.alt.he || sh.alt.en }))).replace(/</g, "\\u003c");
    const card = o => { const c = find(o, /-worn$/) || o.shots[0];
      return `<li><a href="${R}pieces16/${q(o.id)}/"><span class="scpic">${img(c, o, "(min-width: 900px) 20vw, 64vw", { style: `object-position:${FOCUS[c.img] || "50% 50%"}` })}</span>${T(o.kind, "span", "sck")}${T(o.name, "span", "scn")}</a></li>`; };

    const schema = { "@context": "https://schema.org", "@graph": [
      { "@type": "Product", "@id": url + "#product", "name": name, "url": url, "sku": (p.specs || []).map(s => s[1].en).find(v => /^SLV/.test(v)) || undefined,
        "image": p.shots.map(s => base + "/img/" + s.img + "-" + big(p) + ".jpg"), "description": plain(p.line.en), "category": p.cat, "brand": { "@type": "Brand", "name": "SILAVU" } },
      { "@type": "BreadcrumbList", "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "SILAVU", "item": base + "/" },
        { "@type": "ListItem", "position": 2, "name": "The collection", "item": base + "/collection/" },
        { "@type": "ListItem", "position": 3, "name": name, "item": url } ] } ] };
    const title = (p.title && p.title.en) || name + " | SILAVU";
    const desc = plain(p.line.en);

    const aloneBlock = p.film
      ? `<div class="alfilm rv"><video muted loop playsinline preload="none" poster="${R}${q(p.film.poster)}" data-src="${R}${q(p.film.src)}.mp4" data-src-sm="${R}${q(p.film.src)}-720.mp4" aria-label="${q(p.film.alt.en)}" data-alt-he="${q(p.film.alt.he || p.film.alt.en)}"></video><i class="alvig" aria-hidden="true"></i></div>`
      : `<div class="alplate rv">${img(alone, p, "(min-width: 900px) 52vw, 92vw")}</div>`;

    const html = `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${q(title)}</title>
<meta name="description" content="${q(desc)}">
<meta name="robots" content="noindex,nofollow">
<link rel="canonical" href="${q(url)}">
<meta property="og:type" content="product"><meta property="og:site_name" content="SILAVU"><meta property="og:title" content="${q(title)}"><meta property="og:description" content="${q(desc)}"><meta property="og:url" content="${q(url)}"><meta property="og:image" content="${q(base + "/img/" + hero.img + "-1254.jpg")}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#000000">
<link rel="icon" href="${R}favicon.svg" type="image/svg+xml">
<link rel="preload" as="font" type="font/woff2" crossorigin href="${R}fonts/${jost}">
<link rel="preload" as="image" href="${src(hero, p, W(p)[1] || W(p)[0])}" imagesrcset="${set(hero, p)}" imagesizes="(min-width: 900px) 64vw, 100vw" fetchpriority="high">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
<script>document.documentElement.classList.add("js");try{var l=localStorage.getItem("silavu-lang");if(l==="he"||l==="ar"){document.documentElement.lang=l;document.documentElement.dir="rtl";document.documentElement.setAttribute("data-ns","")}}catch(e){}</script>
<style>@font-face{font-family:'Jost';font-style:normal;font-weight:300 600;font-display:swap;src:url(${R}fonts/${jost}) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Jost';font-style:normal;font-weight:300 600;font-display:swap;src:url(${R}fonts/${jostx}) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
${heb ? `@font-face{font-family:'Silavu Hebrew';font-style:normal;font-weight:300 600;font-display:swap;src:url(${R}fonts/${heb}) format('woff2');unicode-range:U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F}` : ""}
@font-face{font-family:'Silavu Name';font-style:normal;font-weight:500;font-display:swap;src:url(${R}fonts/${urb}) format('woff2');unicode-range:U+41,U+49,U+4c,U+53,U+55-56,U+61,U+69,U+6c,U+73,U+75-76}
${css}${PM.css}
</style>
</head>
<body class="p16">
${markDefs()}
<header class="bar hx14">
  <nav class="tnav" aria-label="Main"><a href="${R}collection14/" aria-current="page" data-en="Collection" data-he="קולקציה">Collection</a><a href="${R}test15/#build" data-en="Design yours" data-he="עצבו בעצמכם">Design yours</a><a href="${R}about14/" data-en="About" data-he="אודות">About</a></nav>
  <a class="back" href="${R}test15/" aria-label="SILAVU, back to the house"><span class="lk">${markUse("")}<span class="wm">SILAVU</span></span></a>
  <div class="barr"><a class="pill" href="${VIEW}" data-en="Book a private viewing" data-he="לתיאום פגישה פרטית">Book a private viewing</a><button class="lng" type="button" aria-label="עברית" data-en="EN" data-he="עב">EN</button></div>
</header>
${fix(PM.html)}
<main class="pp16">

  <section class="h16" aria-labelledby="pn">
    <div class="h16pic">${img(hero, p, "(min-width: 900px) 64vw, 100vw", { eager: true, cls: "h16img", style: `object-position:${focus}` })}<i class="h16shade" aria-hidden="true"></i></div>
    <div class="h16txt">
      <nav class="crumbs h16crumbs" aria-label="Breadcrumb"><a href="${R}test15/">SILAVU</a><i aria-hidden="true">/</i><a href="${R}collection14/" data-en="Collection" data-he="קולקציה">Collection</a><i aria-hidden="true">/</i>${T(p.kind)}</nav>
      ${T(p.kind, "p", "h16k")}
      <h1 id="pn" class="h16n" style="--len:${word.length}"><span class="h16s">SILAVU</span> <span class="h16w">${word}</span></h1>
      <span class="h16cue" aria-hidden="true"><i></i></span>
    </div>
  </section>

  <section class="al16${p.film ? " hasfilm" : ""}" aria-label="${q(name)}">
    ${aloneBlock}
    <div class="altxt">
      ${T(p.line, "p", "alline")}
      ${p.film ? T(p.film.alt, "p", "alcap") : ""}
    </div>
  </section>

  ${story ? `<section class="st16" aria-labelledby="sth">
    <h2 class="k16" id="sth" data-en="The story" data-he="הסיפור">The story</h2>
    <p class="stp">${story}</p>
    ${markUse("stmk")}
  </section>` : ""}

  <section class="lp16" aria-labelledby="lph">
    <div class="lphead">
      <h2 class="k16" id="lph" data-en="Up close" data-he="מקרוב">Up close</h2>
      <p class="lphint"><span class="fine" data-en="Move across the photograph to look closer" data-he="העבירו את הסמן על התמונה כדי להתקרב">Move across the photograph to look closer</span><span class="coarse" data-en="Tap the photograph to look closer" data-he="הקישו על התמונה כדי להתקרב">Tap the photograph to look closer</span></p>
    </div>
    <div class="lpbox" data-full="${src(macro, p, big(p))}">
      ${img(macro, p, "(min-width: 900px) 70vw, 100vw", { cls: "lpimg" })}
      <i class="lplens" aria-hidden="true"></i>
    </div>
    ${T(macro.alt, "p", "lpcap")}
  </section>

  <section class="fx16" aria-labelledby="fxh">
    <div class="fxl">
      <h2 class="k16" id="fxh" data-en="The piece" data-he="התכשיט">The piece</h2>
      ${T(p.name, "p", "fxname")}
      ${T(p.kind, "p", "fxkind")}
      <dl class="fxkey">${keys}</dl>
    </div>
    <div class="fxr">
      ${specs ? `<table class="fxspec"><caption data-en="Specification" data-he="מפרט">Specification</caption><tbody>${specs}</tbody></table>` : ""}
      <p class="fxprice" data-en="Price on request" data-he="מחיר לפי בקשה">Price on request</p>
      ${T(S("Made to order by hand in Dubai · Seen in private, by appointment", "מיוצר לפי הזמנה, בעבודת יד בדובאי · בפגישה פרטית, בתיאום מראש"), "p", "fxnote")}
      <div class="fxa">
        <a class="b16 b16p" href="${VIEW}" data-en="Book a private viewing" data-he="לתיאום פגישה פרטית">Book a private viewing</a>
        ${bracelet ? `<a class="lnk" href="${R}test15/#build" data-en="Or design your own bracelet" data-he="או עצבו צמיד משלכם">Or design your own bracelet</a>` : `<a class="lnk" href="${ENQ}" data-en="Enquire" data-he="פנייה">Enquire</a>`}
      </div>
    </div>
  </section>

  <section class="gl16" aria-labelledby="glh">
    <h2 class="k16" id="glh" data-en="Every photograph" data-he="כל התמונות">Every photograph</h2>
    <ul class="glgrid" data-n="${p.shots.length}">${gal}</ul>
  </section>

  <section class="sc16" aria-labelledby="sch">
    <h2 class="k16" id="sch" data-en="${p.group === "special" ? "Also by SILAVU" : "Also in the Signature"}" data-he="${p.group === "special" ? "עוד מ־SILAVU" : "עוד מקולקציית ה־Signature"}">${p.group === "special" ? "Also by SILAVU" : "Also in the Signature"}</h2>
    <ul class="scrow">${(p.group === "special" ? sp.concat(sig) : sig.concat(sp)).map(card).join("")}</ul>
    <a class="lnk scall" href="${R}collection14/" data-en="The whole collection" data-he="כל הקולקציה">The whole collection</a>
  </section>
</main>

<div class="ab16" role="region" aria-label="Private viewing" data-he-label="פגישה פרטית">
  <span class="abname"><b>${q(word)}</b><span data-en="Price on request" data-he="מחיר לפי בקשה">Price on request</span></span>
  <a class="b16 b16g" href="${ENQ}" data-en="Enquire" data-he="פנייה">Enquire</a>
  <a class="b16 b16p" href="${VIEW}" data-en="Book a private viewing" data-he="לתיאום פגישה פרטית">Book a private viewing</a>
</div>

<div class="vw16" role="dialog" aria-modal="true" aria-label="Photographs of ${q(name)}" hidden>
  <div class="vwstage"><img class="vwimg" alt=""></div>
  <div class="vwtop"><span class="vwn" aria-live="polite"><b>01</b> / ${String(p.shots.length).padStart(2, "0")}</span><button class="vwx" type="button" aria-label="Close" data-he-label="סגירה"></button></div>
  <button class="vwar prev" type="button" aria-label="Previous" data-he-label="הקודמת"></button><button class="vwar next" type="button" aria-label="Next" data-he-label="הבאה"></button>
  <p class="vwcap"></p>
  <script type="application/json" class="vwdata">${vdata}</script>
</div>

<footer class="foot"><span data-en="© SILAVU 2026 · Dubai · Tel Aviv · By appointment" data-he="© SILAVU 2026 · דובאי · תל אביב · בתיאום מראש">© SILAVU 2026 · Dubai · Tel Aviv · By appointment</span><a href="${R}collection14/" data-en="Back to the collection" data-he="חזרה לקולקציה">Back to the collection</a></footer>
<script>${js}</script><script>${fix(PM.js)}</script>
</body>
</html>
`;
    return { id: p.id, html };
  });
}
