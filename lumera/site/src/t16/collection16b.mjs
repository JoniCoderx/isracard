/* /collection16b/ — proposal B for the collection (the house, 25 Nov 2026): "Atelier", a private gallery in daylight.
   The opposite of the black site, so the house has a real choice. A warm limestone ground, black ink, the display set in
   the house's Cormorant (already in public/fonts, as /t6/ used it) with Frank Ruhl for Hebrew. The pieces are shown
   as objects in vitrines on the white of the house's own studio photographs: large and small frames interleaved, a
   round loupe holding the macro photograph, captions set as museum labels with only the facts in PIECES (kind, line,
   key facts, reference, "Price on request"). Hovering a vitrine crossfades the studio shot into the worn one; on a
   phone the worn shot stands beside the loupe instead. Filter by kind with text tabs. The special pieces have their
   own room. It ends with the builder and the private viewing. Everything readable is in the HTML, with the
   CollectionPage / ItemList / Product structured data collection14 has. */
import fs from "node:fs";
import path from "node:path";
import { phoneMenu } from "../t14/phonemenu.mjs";

export function page({ PIECES, markDefs, markUse, root, base }) {
  const R = "../";
  const fontsDir = path.join(root, "public/fonts");
  const ff = re => fs.readdirSync(fontsDir).find(x => re.test(x));
  const heb = ff(/^(assistant|rubik)-normal-hebrew-[0-9a-f]{6}\.woff2$/);
  const jost = ff(/^jost-normal-latin-[0-9a-f]{6}\.woff2$/), jostx = ff(/^jost-normal-latin-ext-[0-9a-f]{6}\.woff2$/), urb = ff(/^urbanist-normal-all-[0-9a-f]{6}\.woff2$/);
  const corm = ff(/^cormorant-normal-latin-[0-9a-f]{6}\.woff2$/), cormx = ff(/^cormorant-normal-latin-ext-[0-9a-f]{6}\.woff2$/), frank = ff(/^frank-normal-hebrew-[0-9a-f]{6}\.woff2$/);
  if (!jost || !jostx || !urb) return null;

  /* the phone menu is collection14's sheet; its links are pointed at the t15 / t16 pages, and it is set in daylight below */
  const PM0 = phoneMenu(R, "");
  const PM = { css: PM0.css, js: PM0.js, html: PM0.html.replace(/test14\//g, "test15/").replace(/pieces14\//g, "pieces16/")
    .replace(/href="\.\.\/collection14\/"/g, `href="${R}collection16b/" aria-current="page"`) };

  const q = v => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const plain = s => String(s).replace(/<[^>]+>/g, "");
  const E = (en, he) => `data-en="${q(en)}" data-he="${q(he || en)}"`;
  const EX = x => E(x.en, x.he);
  const shown = PIECES.filter(p => p.id && !p.exceptional && !p.preview);
  const sig = shown.filter(p => p.group !== "special"), sp = shown.filter(p => p.group === "special");
  const W = p => p.widths || [640, 900, 1254];
  const src = (img, p, i = 1) => `${R}img/${img}-${W(p)[i] || W(p)[W(p).length - 1]}.jpg`;
  const set = (img, p) => W(p).map(w => `${R}img/${img}-${w}.jpg ${w}w`).join(", ");
  const pic = (sh, p, sizes, cls, eager) => `<img${cls ? ` class="${cls}"` : ""} src="${src(sh.img, p)}" srcset="${set(sh.img, p)}" sizes="${sizes}" width="1254" height="1254" loading="${eager ? "eager" : "lazy"}"${eager ? ' fetchpriority="high"' : ""} decoding="async" alt="${q(sh.alt.en)}" data-alt-he="${q(sh.alt.he || sh.alt.en)}">`;
  const shot = (p, re) => p.shots.find(s => re.test(s.img));
  const studio = p => p.shots[0];
  const worn = p => shot(p, /-worn$/);
  const macro = p => shot(p, /-macro$/) || p.shots[2] || p.shots[1];
  const signed = p => shot(p, /-(signed|clasp)$/);
  const ref = p => { const r = (p.specs || []).find(s => /reference/i.test(s[0].en)); return r ? r[1].en : ""; };
  const no = i => String(i + 1).padStart(2, "0");
  const url = id => `${R}pieces16/${q(id)}/`;
  const VIEW = `${R}test15/?for=viewing#concierge`, BUILD = `${R}test15/#build`, HOME = `${R}test15/`;
  const cats = [["all", "All", "הכל"], ["bracelets", "Bracelets", "צמידים"], ["rings", "Rings", "טבעות"], ["necklaces", "Necklaces", "שרשראות"], ["earrings", "Earrings", "עגילים"]]
    .map(([c, n, nh]) => [c, n, nh, c === "all" ? shown.length : shown.filter(p => p.cat === c).length]).filter(x => x[3]);

  /* the museum label: number and reference, the name, the kind, the line, the key facts, the price line, the two ways in */
  const label = (p, i, small) => `<div class="lb">
      <p class="lbno"><span>N° ${no(i)}</span>${ref(p) ? `<span class="lbref">${q(ref(p))}</span>` : ""}</p>
      <h3 class="lbn" id="n-${q(p.id)}" ${EX(p.name)}>${p.name.en}</h3>
      <p class="lbk" ${EX(p.kind)}>${q(p.kind.en)}</p>
      <p class="lbl" ${E(plain(p.line.en), plain(p.line.he || p.line.en))}>${q(plain(p.line.en))}</p>
      ${small ? "" : `<dl class="lbf">${(p.key || []).map(([k, v]) => `<div><dt ${EX(k)}>${q(k.en)}</dt><dd ${EX(v)}>${q(v.en)}</dd></div>`).join("")}</dl>`}
      <p class="lbp" ${E("Price on request", "מחיר לפי בקשה")}>Price on request</p>
      <p class="lba"><a class="go" href="${url(p.id)}"><span ${E("View the piece", "לצפייה בתכשיט")}>View the piece</span><i aria-hidden="true"></i></a><a class="ul" href="${VIEW}" ${E("Book a private viewing", "לתיאום פגישה פרטית")}>Book a private viewing</a></p>
    </div>`;

  /* a vitrine: the studio photograph, the worn one under it for the hover */
  const vitrine = (p, sizes, eager) => { const a = studio(p), b = worn(p) || macro(p);
    return `<a class="vit" href="${url(p.id)}" aria-label="${q(p.plain || plain(p.name.en))}">${pic(a, p, sizes, "s", eager)}${b ? pic(b, p, sizes, "w") : ""}<span class="vitk" aria-hidden="true" ${E(worn(p) ? "Worn" : "Close", worn(p) ? "על הגוף" : "מקרוב")}>${worn(p) ? "Worn" : "Close"}</span></a>`; };
  /* the loupe: the macro photograph in a round frame; on a desktop it follows the pointer, closer */
  const loupe = (p, i) => { const m = macro(p); return m ? `<figure class="lp"><a class="lpin" href="${url(p.id)}" tabindex="-1" aria-hidden="true"><span class="lpc">${pic(m, p, "(min-width: 900px) 24vw, 44vw", "")}</span></a>
      <figcaption><span ${E("Under the loupe", "מתחת לזכוכית המגדלת")}>Under the loupe</span> <b>N° ${no(i)}</b></figcaption></figure>` : ""; };
  /* on a phone the worn photograph stands beside the loupe (no hover there) */
  const wornFrame = p => { const w = worn(p); return w ? `<figure class="wf"><a href="${url(p.id)}" tabindex="-1" aria-hidden="true">${pic(w, p, "44vw", "")}</a><figcaption ${E("Worn", "על הגוף")}>Worn</figcaption></figure>` : ""; };

  const exhibit = (p, i) => `<article class="ex v${i % 4}" data-cat="${q(p.cat)}" id="${q(p.id)}" aria-labelledby="n-${q(p.id)}">
    ${vitrine(p, "(min-width: 900px) 52vw, 100vw", i === 0)}
    ${loupe(p, i)}${wornFrame(p)}
    ${label(p, i)}
  </article>`;

  /* a wall between the rooms: every piece is signed */
  const signedWall = shown.filter(signed).slice(0, 4);
  const wall = signedWall.length >= 3 ? `<section class="wall" aria-labelledby="wh">
    <div class="wallh"><p class="eyb" ${E("A note on the wall", "הערה על הקיר")}>A note on the wall</p><h2 id="wh" class="dsp" ${E("Each piece is <em>signed</em> SILAVU.", "כל תכשיט <em>חתום</em> SILAVU.")}>Each piece is <em>signed</em> SILAVU.</h2></div>
    <ul class="walll">${signedWall.map(p => { const s = signed(p); return `<li data-cat="${q(p.cat)}"><a href="${url(p.id)}"><span class="wpic">${pic(s, p, "(min-width: 900px) 22vw, 62vw", "")}</span><span class="wcap"><b ${EX(p.name)}>${p.name.en}</b><span ${EX(p.kind)}>${q(p.kind.en)}</span></span></a></li>`; }).join("")}</ul>
  </section>` : "";

  const room = (p, j) => { const i = sig.length + j;
    return `<li class="rm r${j % 3}" data-cat="${q(p.cat)}" id="${q(p.id)}">
      ${vitrine(p, "(min-width: 900px) 34vw, 86vw")}
      ${label(p, i, true)}
    </li>`; };

  /* the opening's three frames: a worn photograph, an object, the loupe */
  const h1p = sig[0], h2p = sig.find(p => p.cat === "earrings") || sig[1], h3p = sig.find(p => p.cat === "necklaces") || sig[2];
  const heroW = worn(h1p) || studio(h1p);

  const builderP = sig.find(p => p.cat === "bracelets") || sig[0];
  const builderShot = shot(builderP, /-full$/) || studio(builderP);
  const viewP = sig.find(p => p.cat === "rings") || sig[1];
  const viewShot = worn(viewP) || studio(viewP);
  const viewSide = sp.find(p => worn(p)) || sig[2];

  const title = "Diamond Jewellery Collection · Bracelets, Rings, Necklaces & Earrings | SILAVU";
  const desc = "Diamond bracelets, rings, necklaces and earrings in 18K gold, signed by SILAVU and made to order by hand in Dubai. Seen in private, by appointment.";
  const canon = base + "/collection/";
  const items = shown.map((p, i) => ({ "@type": "ListItem", "position": i + 1, "url": base + "/pieces/" + p.id + "/",
    "item": { "@type": "Product", "name": p.plain || plain(p.name.en), "url": base + "/pieces/" + p.id + "/", "image": base + "/img/" + p.shots[0].img + "-" + W(p).slice(-1)[0] + ".jpg",
      "description": plain(p.line.en), "category": p.cat, "sku": ref(p) || undefined, "brand": { "@type": "Brand", "name": "SILAVU" } } }));
  const schema = { "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", "@id": canon + "#page", "url": canon, "name": "The SILAVU collection", "description": desc, "inLanguage": "en",
      "isPartOf": { "@type": "WebSite", "name": "SILAVU", "url": base + "/" }, "mainEntity": { "@type": "ItemList", "numberOfItems": shown.length, "itemListElement": items } },
    { "@type": "BreadcrumbList", "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "SILAVU", "item": base + "/" },
      { "@type": "ListItem", "position": 2, "name": "The collection", "item": canon } ] } ] };
  const here = path.join(root, "src", "t16");
  const css = fs.readFileSync(path.join(root, "src", "t14", "header14.css"), "utf8") + fs.readFileSync(path.join(here, "collection16b.css"), "utf8");
  const js = fs.readFileSync(path.join(here, "collection16b.js"), "utf8") + fs.readFileSync(path.join(root, "src", "t14", "lang14.js"), "utf8");
  const og = base + "/img/" + heroW.img + "-1254.jpg";
  const LAT = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
  const LATX = "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";
  const HEB = "U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F";

  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${q(title)}</title>
<meta name="description" content="${q(desc)}">
<meta name="robots" content="noindex,nofollow">
<link rel="canonical" href="${q(canon)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="SILAVU"><meta property="og:title" content="${q(title)}"><meta property="og:description" content="${q(desc)}"><meta property="og:url" content="${q(canon)}"><meta property="og:image" content="${q(og)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#efe9df">
<link rel="icon" href="${R}favicon.svg" type="image/svg+xml">
<link rel="preload" as="font" type="font/woff2" crossorigin href="${R}fonts/${jost}">
${corm ? `<link rel="preload" as="font" type="font/woff2" crossorigin href="${R}fonts/${corm}">` : ""}
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
<script>document.documentElement.classList.add("js");try{var l=localStorage.getItem("silavu-lang");if(l==="he"||l==="ar"){document.documentElement.lang=l;document.documentElement.dir="rtl";document.documentElement.setAttribute("data-ns","")}}catch(e){}</script>
<style>@font-face{font-family:'Jost';font-style:normal;font-weight:300 600;font-display:swap;src:url(${R}fonts/${jost}) format('woff2');unicode-range:${LAT}}
@font-face{font-family:'Jost';font-style:normal;font-weight:300 600;font-display:swap;src:url(${R}fonts/${jostx}) format('woff2');unicode-range:${LATX}}
${heb ? `@font-face{font-family:'Silavu Hebrew';font-style:normal;font-weight:300 600;font-display:swap;src:url(${R}fonts/${heb}) format('woff2');unicode-range:${HEB}}` : ""}
${corm ? `@font-face{font-family:'Atelier';font-style:normal;font-weight:300 600;font-display:swap;src:url(${R}fonts/${corm}) format('woff2');unicode-range:${LAT}}` : ""}
${cormx ? `@font-face{font-family:'Atelier';font-style:normal;font-weight:300 600;font-display:swap;src:url(${R}fonts/${cormx}) format('woff2');unicode-range:${LATX}}` : ""}
${frank ? `@font-face{font-family:'Atelier';font-style:normal;font-weight:300 500;font-display:swap;src:url(${R}fonts/${frank}) format('woff2');unicode-range:${HEB}}` : ""}
@font-face{font-family:'Silavu Name';font-style:normal;font-weight:500;font-display:swap;src:url(${R}fonts/${urb}) format('woff2');unicode-range:U+41,U+49,U+4c,U+53,U+55-56,U+61,U+69,U+6c,U+73,U+75-76}
${PM.css}
${css}
</style>
</head>
<body>
${markDefs()}
<header class="bar hx14">
  <nav class="tnav" aria-label="Main"><a href="${R}collection16b/" aria-current="page" data-en="Collection" data-he="קולקציה">Collection</a><a href="${BUILD}" data-en="Design yours" data-he="עצבו בעצמכם">Design yours</a><a href="${R}about14/" data-en="About" data-he="אודות">About</a></nav>
  <a class="back" href="${HOME}" aria-label="SILAVU, back to the house"><span class="lk">${markUse("")}<span class="wm">SILAVU</span></span></a>
  <div class="barr"><a class="pill" href="${VIEW}" data-en="Book a private viewing" data-he="לתיאום פגישה פרטית">Book a private viewing</a><button class="lng" type="button" aria-label="עברית" data-en="EN" data-he="עב">EN</button></div>
</header>
${PM.html}
<main>
  <section class="op" aria-labelledby="ch">
    <div class="optx">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="${HOME}">SILAVU</a><i aria-hidden="true">/</i><span aria-current="page" ${E("The collection", "הקולקציה")}>The collection</span></nav>
      <h1 id="ch" class="oph"><span class="oph1" ${E("The", "SILAVU")}>The</span> <span class="oph2" ${E("Collection", "הקולקציה")}>Collection</span></h1>
    </div>
    <div class="opd">
      <p class="opl" ${E("Diamond bracelets, rings, necklaces and earrings in 18K gold, each signed by SILAVU and made to order by hand in Dubai.", "צמידים, טבעות, שרשראות ועגילים של יהלומים בזהב 18K, כל אחד חתום SILAVU ומיוצר לפי הזמנה בעבודת יד בדובאי.")}>Diamond bracelets, rings, necklaces and earrings in 18K gold, each signed by SILAVU and made to order by hand in Dubai.</p>
      <p class="opm"><span ${E(shown.length + " pieces", shown.length + " תכשיטים")}>${shown.length} pieces</span><i aria-hidden="true"></i><span ${E("Made to order", "מיוצר לפי הזמנה")}>Made to order</span><i aria-hidden="true"></i><span ${E("Seen by appointment", "בתיאום מראש")}>Seen by appointment</span></p>
    </div>
    <figure class="opa"><a href="${url(h1p.id)}" tabindex="-1" aria-hidden="true">${pic(heroW, h1p, "(min-width: 900px) 40vw, 78vw", "", true)}</a><figcaption><b ${EX(h1p.name)}>${h1p.name.en}</b> <span ${E("Worn", "על הגוף")}>Worn</span></figcaption></figure>
    <figure class="opb"><a href="${url(h2p.id)}" tabindex="-1" aria-hidden="true">${pic(studio(h2p), h2p, "(min-width: 900px) 20vw, 46vw", "", true)}</a><figcaption><b ${EX(h2p.name)}>${h2p.name.en}</b></figcaption></figure>
    <figure class="opc"><a href="${url(h3p.id)}" tabindex="-1" aria-hidden="true">${pic(macro(h3p), h3p, "(min-width: 900px) 16vw, 34vw", "", true)}</a></figure>
  </section>

  <div class="tabs" role="toolbar" aria-label="Show"><div class="tabsin">${cats.map(([c, n, nh, k], i) => `<button type="button" class="tab${i ? "" : " on"}" data-f="${c}" aria-pressed="${i ? "false" : "true"}"><span ${E(n, nh)}>${n}</span><sup>${k}</sup></button>`).join("")}</div></div>

  <section class="gal" id="gal" aria-labelledby="sh">
    <header class="rh"><p class="eyb"><span ${E("Room I", "חדר I")}>Room I</span></p><h2 id="sh" class="dsp" ${E("The <em>Signature</em>", "ה<em>חתימה</em>")}>The <em>Signature</em></h2><p class="rhl" ${E("The SILAVU signature, in four forms. Move across a piece to see it worn.", "חתימת SILAVU, בארבע צורות. העבירו את הסמן מעל תכשיט כדי לראות אותו על הגוף.")}>The SILAVU signature, in four forms. Move across a piece to see it worn.</p></header>
    ${sig.map((p, i) => exhibit(p, i)).join("\n")}
  </section>

  ${wall}

  ${sp.length ? `<section class="room" id="special" aria-labelledby="ph">
    <header class="rh"><p class="eyb"><span ${E("Room II", "חדר II")}>Room II</span></p><h2 id="ph" class="dsp" ${E("The <em>Special</em> pieces", "התכשיטים ה<em>מיוחדים</em>")}>The <em>Special</em> pieces</h2><p class="rhl" ${E("In a room of their own: coloured gold, a single baguette, pink sapphires.", "בחדר משלהם: זהב צבעוני, יהלום בגט יחיד, ספירים ורודים.")}>In a room of their own: coloured gold, a single baguette, pink sapphires.</p></header>
    <ul class="rml">${sp.map(room).join("")}</ul>
  </section>` : ""}

  <section class="mk" aria-labelledby="mkh">
    <figure class="mkpic"><a href="${BUILD}" tabindex="-1" aria-hidden="true">${pic(builderShot, builderP, "(min-width: 900px) 46vw, 100vw", "")}</a></figure>
    <div class="mktx">
      <p class="eyb" ${E("The atelier", "הסדנה")}>The atelier</p>
      <h2 id="mkh" class="dsp" ${E("Or one made <em>only for you.</em>", "או אחד שנוצר <em>רק בשבילכם.</em>")}>Or one made <em>only for you.</em></h2>
      <p class="mkl" ${E("Choose the stones, the carat, the size and the metal, and see your bracelet take shape before it is made.", "בחרו את האבנים, הקראט, המידה והמתכת, וראו את הצמיד שלכם מקבל צורה עוד לפני שהוא נוצר.")}>Choose the stones, the carat, the size and the metal, and see your bracelet take shape before it is made.</p>
      <p class="lba"><a class="go dark" href="${BUILD}"><span ${E("Design your bracelet", "עצבו צמיד")}>Design your bracelet</span><i aria-hidden="true"></i></a></p>
    </div>
  </section>

  <section class="pv" aria-labelledby="pvh">
    <figure class="pva"><a href="${url(viewP.id)}" tabindex="-1" aria-hidden="true">${pic(viewShot, viewP, "(min-width: 900px) 44vw, 100vw", "")}</a></figure>
    ${viewSide && worn(viewSide) ? `<figure class="pvb"><a href="${url(viewSide.id)}" tabindex="-1" aria-hidden="true">${pic(worn(viewSide), viewSide, "(min-width: 900px) 20vw, 44vw", "")}</a></figure>` : ""}
    <div class="pvtx">
      ${markUse("pvmk")}
      <h2 id="pvh" class="dsp" ${E("Seen in <em>private.</em>", "בפגישה <em>פרטית.</em>")}>Seen in <em>private.</em></h2>
      <p class="mkl" ${E("Every piece is made to order by hand in Dubai, and seen in private, by appointment.", "כל תכשיט מיוצר לפי הזמנה בעבודת יד בדובאי, ונצפה בפגישה פרטית, בתיאום מראש.")}>Every piece is made to order by hand in Dubai, and seen in private, by appointment.</p>
      <p class="lba"><a class="go dark" href="${VIEW}"><span ${E("Book a private viewing", "לתיאום פגישה פרטית")}>Book a private viewing</span><i aria-hidden="true"></i></a></p>
    </div>
  </section>
</main>
<footer class="foot"><span ${E("© SILAVU 2026 · Dubai · Tel Aviv · By appointment", "© SILAVU 2026 · דובאי · תל אביב · בתיאום מראש")}>© SILAVU 2026 · Dubai · Tel Aviv · By appointment</span><a href="${HOME}" ${E("Back to the house", "חזרה לבית")}>Back to the house</a></footer>
<script>${js}</script><script>${PM.js}</script>
</body>
</html>
`;
}
