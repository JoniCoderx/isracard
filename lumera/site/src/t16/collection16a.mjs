/* /collection16a/ (proposal A, the house, 25 Nov 2026): the collection as a film, at night.
   It opens on one vast word with the house's own film playing inside its letters; scrolling, the word opens until the
   film fills the screen. Then each piece of the Signature is a chapter of its own: its worn photograph opens out of a
   thin slit of light, as a cinema screen does, cropped close on the skin and the stone, and the piece's name is set
   enormous across it. The special pieces follow as a strip of large frames, and the page ends on the one made for you.
   Everything is in the HTML (the h1, every name, line and fact), with the CollectionPage / ItemList / Product data and
   the breadcrumb; only the house's own words, photographs and film. Nothing is invented: no price, no figure. */
import fs from "node:fs";
import path from "node:path";
import { phoneMenu } from "../t14/phonemenu.mjs";

export function page({ PIECES, markDefs, markUse, root, base }) {
  const R = "../";
  const PM = phoneMenu(R, "collection16a/");
  const fontsDir = path.join(root, "public/fonts");
  const ff = re => fs.readdirSync(fontsDir).find(x => re.test(x));
  const heb = ff(/^(assistant|rubik)-normal-hebrew-[0-9a-f]{6}\.woff2$/);
  const jost = ff(/^jost-normal-latin-[0-9a-f]{6}\.woff2$/), jostx = ff(/^jost-normal-latin-ext-[0-9a-f]{6}\.woff2$/), urb = ff(/^urbanist-normal-all-[0-9a-f]{6}\.woff2$/);
  if (!jost || !jostx || !urb) return null;
  const q = v => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const plain = s => String(s).replace(/<[^>]+>/g, "");
  const E = (en, he) => `data-en="${q(en)}" data-he="${q(he || en)}"`;
  const EX = x => E(x.en, x.he);
  const TA = x => `alt="${q(x.en)}" data-alt-he="${q(x.he || x.en)}"`;
  const shown = PIECES.filter(p => p.id && !p.exceptional && !p.preview);
  const sig = shown.filter(p => p.group !== "special"), sp = shown.filter(p => p.group === "special");
  const W = p => p.widths || [640, 900, 1254];
  const set = (img, p) => W(p).map(w => `${R}img/${img}-${w}.jpg ${w}w`).join(", ");
  const src = (img, p) => `${R}img/${img}-${W(p)[1] || W(p)[0]}.jpg`;
  const shot = (p, re) => p.shots.find(s => re.test(s.img));
  const worn = p => shot(p, /-worn$/) || p.shots[1] || p.shots[0];
  const macro = p => shot(p, /-macro$/) || p.shots[0];
  const word = p => p.word || plain(p.name.en).replace(/^SILAVU\s+/, "");
  const facts = p => (p.meta || []).filter(m => !/price/i.test(m.en)).map(m => `<li ${EX(m)}>${q(m.en)}</li>`).join("");
  /* where the piece sits in each worn photograph (measured on the house's own frames), so the close crop lands on it */
  const FOCUS = { "knot-worn": "52% 58%", "ring-worn": "62% 50%", "necklace-worn": "50% 70%", "aura-worn": "55% 57%", "blush-worn": "50% 56%", "cadence-worn": "54% 62%" };
  const focus = img => FOCUS[img] || "50% 50%";
  const cats = [["all", "All", "הכל"], ["bracelets", "Bracelets", "צמידים"], ["rings", "Rings", "טבעות"], ["necklaces", "Necklaces", "שרשראות"], ["earrings", "Earrings", "עגילים"]].filter(([c]) => c === "all" || shown.some(p => p.cat === c));
  const film = (sig.find(p => p.film) || {}).film;
  const two = n => String(n).padStart(2, "0");
  const viewing = `${R}test15/?for=viewing#concierge`;

  /* a chapter: the worn photograph, the name across it, the line and the facts, the two ways in */
  const chapter = (p, i) => { const a = worn(p), w = word(p);
    return `<article class="c16 ${i % 2 ? "rev" : ""}" data-cat="${q(p.cat)}" id="${q(p.id)}" aria-labelledby="n-${q(p.id)}">
  <div class="c16f">
    <a class="c16pic" href="${R}pieces16/${q(p.id)}/" tabindex="-1" aria-hidden="true">
      <img src="${src(a.img, p)}" srcset="${set(a.img, p)}" sizes="(min-width: 900px) 64vw, 100vw" width="1254" height="1254" loading="${i < 1 ? "eager" : "lazy"}" decoding="async" ${TA(a.alt)} style="object-position:${focus(a.img)};transform-origin:${focus(a.img)}">
    </a>
    <div class="c16t">
      <p class="c16no" aria-hidden="true"><b>${two(i + 1)}</b><i></i><span>${two(sig.length)}</span></p>
      <p class="c16k" ${EX(p.kind)}>${q(p.kind.en)}</p>
      <h3 class="c16n" id="n-${q(p.id)}"><span class="c16s">SILAVU</span> <span class="c16w" style="--n:${w.length}"><span>${q(w)}</span></span></h3>
      <p class="c16l" ${E(plain(p.line.en), plain(p.line.he || p.line.en))}>${q(plain(p.line.en))}</p>
      <ul class="c16m">${facts(p)}</ul>
      <div class="c16a"><a class="go16" href="${R}pieces16/${q(p.id)}/" ${E("View the piece", "לצפייה בתכשיט")}>View the piece</a><a class="ln16" href="${viewing}" ${E("Book a private viewing", "לתיאום פגישה פרטית")}>Book a private viewing</a></div>
    </div>
  </div>
</article>`; };

  /* a frame of the strip: the stone close (the macro), the reference as on a slate, the name and the line */
  const frame = (p, i) => { const a = macro(p);
    return `<li class="f16" data-cat="${q(p.cat)}" id="${q(p.id)}"><a href="${R}pieces16/${q(p.id)}/">
  <span class="f16pic"><img src="${src(a.img, p)}" srcset="${set(a.img, p)}" sizes="(min-width: 900px) 62vh, 84vw" width="1254" height="1254" loading="lazy" decoding="async" ${TA(a.alt)}></span>
  <span class="f16cap"><span class="f16ref">${q(p.ref || "")}</span><span class="f16k" ${EX(p.kind)}>${q(p.kind.en)}</span></span>
  <span class="f16n">${q(plain(p.name.en))}</span>
  <span class="f16l" ${E(plain(p.line.en), plain(p.line.he || p.line.en))}>${q(plain(p.line.en))}</span></a></li>`; };

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
  const here = path.join(root, "src", "t16");
  const css = fs.readFileSync(path.join(root, "src", "t14", "header14.css"), "utf8") + fs.readFileSync(path.join(here, "collection16a.css"), "utf8");
  const js = fs.readFileSync(path.join(here, "collection16a.js"), "utf8") + fs.readFileSync(path.join(root, "src", "t14", "lang14.js"), "utf8");
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
${film ? `<link rel="preload" as="image" href="${R}${q(film.poster)}">` : ""}
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
  <nav class="tnav" aria-label="Main"><a href="${R}collection16a/" aria-current="page" data-en="Collection" data-he="קולקציה">Collection</a><a href="${R}test15/#build" data-en="Design yours" data-he="עצבו בעצמכם">Design yours</a><a href="${R}about14/" data-en="About" data-he="אודות">About</a></nav>
  <a class="back" href="${R}test15/" aria-label="SILAVU, back to the house"><span class="lk">${markUse("")}<span class="wm">SILAVU</span></span></a>
  <div class="barr"><a class="pill" href="${viewing}" data-en="Book a private viewing" data-he="לתיאום פגישה פרטית">Book a private viewing</a><button class="lng" type="button" aria-label="עברית" data-en="EN" data-he="עב">EN</button></div>
</header>
${PM.html}
<main>
  <section class="h16" aria-labelledby="ch">
    <div class="h16f">
      ${film ? `<video class="h16v" muted loop playsinline preload="metadata" poster="${R}${q(film.poster)}" data-src="${R}${q(film.src)}.mp4" data-src-sm="${R}${q(film.src)}-720.mp4" aria-label="${q(film.alt.en)}" data-alt-he="${q(film.alt.he || film.alt.en)}"></video>` : ""}
      <div class="h16w" aria-hidden="true"><span class="h16word" ${E("Collection", "הקולקציה")}>Collection</span></div>
      <div class="h16o" aria-hidden="true"><span class="h16word" ${E("Collection", "הקולקציה")}>Collection</span></div>
      <div class="h16t">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="${R}test15/">SILAVU</a><i aria-hidden="true">/</i><span aria-current="page" ${E("The collection", "הקולקציה")}>The collection</span></nav>
        <h1 id="ch" ${E("The SILAVU <em>collection</em>", "קולקציית <em>SILAVU</em>")}>The SILAVU <em>collection</em></h1>
        <p class="h16l" ${E("Diamond bracelets, rings, necklaces and earrings in 18K gold, each signed by SILAVU and made to order by hand in Dubai.", "צמידים, טבעות, שרשראות ועגילים של יהלומים בזהב 18K, כל אחד חתום SILAVU ומיוצר לפי הזמנה בעבודת יד בדובאי.")}>Diamond bracelets, rings, necklaces and earrings in 18K gold, each signed by SILAVU and made to order by hand in Dubai.</p>
        <div class="flt" role="toolbar" aria-label="Show">${cats.map(([c, n, nh], i) => `<button type="button" class="fb${i ? "" : " on"}" data-f="${c}" aria-pressed="${i ? "false" : "true"}" ${E(n, nh)}>${n}</button>`).join("")}</div>
      </div>
      <p class="h16cue" aria-hidden="true" ${E("Scroll", "גללו")}>Scroll</p>
    </div>
  </section>

  <section class="sig16" id="signature" aria-labelledby="sh">
    <header class="it16">${markUse("itmk")}<h2 id="sh" ${E("The Signature", "החתימה")}>The Signature</h2></header>
    ${sig.map(chapter).join("\n    ")}
  </section>

  ${sp.length ? `<section class="sp16" id="special" aria-labelledby="ph">
    <header class="sp16h"><h2 id="ph" ${E("Special pieces", "תכשיטים מיוחדים")}>Special pieces</h2>
      <div class="sp16nav"><button type="button" class="ar16 prev" aria-label="Previous" data-he-label="הקודם"></button><button type="button" class="ar16 next" aria-label="Next" data-he-label="הבא"></button></div></header>
    <ul class="strip16" tabindex="0" aria-label="Special pieces">${sp.map(frame).join("")}</ul>
  </section>` : ""}

  <section class="mk16" aria-labelledby="mkh">
    <h2 id="mkh" ${E("Or one made <em>only for you.</em>", "או אחד שנוצר <em>רק בשבילכם.</em>")}>Or one made <em>only for you.</em></h2>
    <p ${E("Choose the stones, the carat, the size and the metal, and see your bracelet take shape before it is made.", "בחרו את האבנים, הקראט, המידה והמתכת, וראו את הצמיד שלכם מקבל צורה עוד לפני שהוא נוצר.")}>Choose the stones, the carat, the size and the metal, and see your bracelet take shape before it is made.</p>
    <div class="mka"><a class="bld16" href="${R}test15/#build"><span class="bldmk" aria-hidden="true">${markUse("")}</span><span ${E("Design your bracelet", "עצבו צמיד")}>Design your bracelet</span><i class="bldar" aria-hidden="true"></i></a><a class="ln16" href="${viewing}" ${E("Book a private viewing", "לתיאום פגישה פרטית")}>Book a private viewing</a></div>
  </section>
</main>
<footer class="foot"><span ${E("© SILAVU 2026 · Dubai · Tel Aviv · By appointment", "© SILAVU 2026 · דובאי · תל אביב · בתיאום מראש")}>© SILAVU 2026 · Dubai · Tel Aviv · By appointment</span><a href="${R}test15/" ${E("Back to the house", "חזרה לבית")}>Back to the house</a></footer>
<script>${js}</script><script>${PM.js}</script>
</body>
</html>
`;
}
