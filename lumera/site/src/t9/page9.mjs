/* /test9/: SILAVU as a maison, black and ivory, made only of the best the
   house already has: the LUMIÈRE campaign film opens it; the signature
   pieces as a boutique grid (the studio photograph, and the piece worn when
   the hand comes near); SOUL, ICON and MOMENT in their own films, turning in
   black (out of a void, on a mirror, on satin); her, wearing them; the
   special pieces; the appointment, on black leather. Bodoni Moda (Frank
   Ruhl Libre in Hebrew) for the voice, Jost (Heebo) in wide capitals for the
   words, the wordmark in Urbanist. Nothing is played by the scroll: films
   play while seen, one at a time on a phone; the page is the browser's own.
   Styles in src/t9/t9.css, behaviour in src/t9/t9.js. */
import fs from "node:fs";
import path from "node:path";

export function test9Page({ PIECES, FOOTER_DOCS, markDefs, markUse, logo, root }) {
  const R = "../";
  const q = v => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const E = (en, he) => `data-en="${q(en)}" data-he="${q(he)}"`;
  const t = (tag, cls, en, he, extra = "") => `<${tag}${cls ? ` class="${cls}"` : ""} ${E(en, he)}${extra}>${en}</${tag}>`;
  const P = id => PIECES.find(p => p.id === id);
  const spec = (p, label) => { const r = (p.specs || []).find(x => x[0].en === label); return r ? r[1] : null; };
  const fontsDir = path.join(root, "public/fonts");
  const font = k => { const f = fs.readdirSync(fontsDir).find(x => x.startsWith(k + "-") && /-[0-9a-f]{6}\.woff2$/.test(x)); if (!f) throw new Error("test9: font " + k + " missing"); return R + "fonts/" + f; };
  const LATIN = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
  const LATINX = "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF";
  const HEB = "U+0307-0308, U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F";
  const CYR = "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116";
  const face = (fam, w, file, range, style = "normal") => `@font-face{font-family:'${fam}';font-style:${style};font-weight:${w};font-display:swap;src:url(${file}) format('woff2');unicode-range:${range}}`;
  const faces = [
    face("Silavu Serif", "400 600", font("bodoni-normal-latin"), LATIN), face("Silavu Serif", "400 600", font("bodoni-normal-latin-ext"), LATINX),
    face("Silavu Serif", "400 600", font("bodoni-italic-latin"), LATIN, "italic"), face("Silavu Serif", "300 500", font("frank-normal-hebrew"), HEB),
    face("Silavu Text", "300 600", font("jost-normal-latin"), LATIN), face("Silavu Text", "300 600", font("jost-normal-latin-ext"), LATINX), face("Silavu Text", "300 600", font("jost-normal-cyrillic"), CYR),
    face("Silavu Text", "300 600", font("heebo-normal-hebrew"), HEB),
    face("Urbanist", "500", font("urbanist-normal-all"), "U+41, U+49, U+4c, U+53, U+55-56, U+61, U+69, U+6c, U+73, U+75-76")
  ].join("\n");
  const read = f => fs.readFileSync(path.join(root, "src", "t9", f), "utf8");
  const plain = s => s.replace(/<[^>]+>/g, "");
  const LIST = PIECES.filter(p => p.id && !p.exceptional);
  const SIG = ["pave", "ring", "knot", "aura"].map(P).filter(Boolean), SPECIAL = ["blush", "promise", "cadence"].map(P).filter(Boolean);
  const WORN = { knot: "knot-worn", ring: "ring-worn", pave: "necklace-worn", aura: "aura-worn", promise: "promise-macro", blush: "blush-worn", cadence: "cadence-worn" };
  if (SIG.length < 4 || SPECIAL.length < 3) return null;

  /* a boutique card: the studio photograph, and the piece worn when the
     pointer comes to it (a second picture, faded in: nothing is redrawn);
     PROMISE has no photograph worn, so its close-up stands in */
  const card = p => `<li class="card">
      <a class="cimg" href="${R}pieces/${p.id}/" aria-label="${q(plain(p.name.en))}" data-aria-he="${q(plain(p.name.he))}">
        <img class="c1" src="${R}studio6/${p.id}-a-700.webp" srcset="${R}studio6/${p.id}-a-700.webp 700w, ${R}studio6/${p.id}-a-1200.webp 1200w" sizes="(max-width: 760px) 50vw, 25vw" width="1200" height="1200" alt="" loading="lazy" decoding="async">
        <img class="c2" src="${R}img/${WORN[p.id]}-900.jpg" srcset="${R}img/${WORN[p.id]}-640.jpg 640w, ${R}img/${WORN[p.id]}-900.jpg 900w, ${R}img/${WORN[p.id]}-1254.jpg 1254w" sizes="(max-width: 760px) 50vw, 25vw" alt="" loading="lazy" decoding="async">
      </a>
      <p class="cname"><a href="${R}pieces/${p.id}/" ${E(p.name.en, p.name.he)}>${p.name.en}</a></p>
      ${t("p", "ckind", p.kind.en, p.kind.he)}
      <button class="cbook" type="button" data-book="${p.id}"><span ${E("Book a viewing", "תיאום צפייה")}>Book a viewing</span></button>
    </li>`;

  /* a piece in its film: turning in black */
  const FILMS = [["pave", "soul"], ["ring", "icon"], ["knot", "moment"]].map(([id, f]) => [P(id), f]).filter(([p]) => p);
  const specRows = p => (p.specs || []).filter(r => r[0].en !== "Price" && r[0].en !== "Reference").slice(0, 3).map(([k, v]) => `<dt ${E(k.en, k.he)}>${k.en}</dt><dd ${E(v.en, v.he)}>${v.en}</dd>`).join("");
  const filmRow = ([p, f], i) => `<article class="frow${i % 2 ? " flip" : ""}" id="f-${p.id}">
      <div class="fmedia"><img class="fpost" src="${R}img/${f}-film-poster.jpg" width="1080" height="1080" alt="" loading="lazy" decoding="async"><video class="vid" muted playsinline loop preload="none" data-src="${R}v/${f}-film.mp4" data-src-m="${R}v/${f}-film-720.mp4" aria-hidden="true"></video></div>
      <div class="ftext">
        ${t("p", "k", p.kind.en, p.kind.he)}
        <h3 class="fname"><a href="${R}pieces/${p.id}/" ${E(p.name.en, p.name.he)}>${p.name.en}</a></h3>
        ${p.line ? t("p", "p", p.line.en, p.line.he) : ""}
        <dl class="specs">${specRows(p)}${spec(p, "Reference") ? `<dt ${E("Reference", "מק\"ט")}>Reference</dt><dd dir="ltr">${q(spec(p, "Reference").en)}</dd>` : ""}</dl>
        <div class="acts"><a class="btn light" href="${R}pieces/${p.id}/"><span ${E("Discover", "לגלות")}>Discover</span></a><button class="btn ghost" type="button" data-book="${p.id}"><span ${E("Book a viewing", "תיאום צפייה")}>Book a viewing</span></button></div>
      </div>
    </article>`;

  const hero = `<section id="top" class="hero" aria-labelledby="h1">
  <div class="hmedia"><picture><source media="(max-aspect-ratio: 1/1)" srcset="${R}img/hero-lumiere-v-1080.jpg"><img class="hpost" src="${R}img/hero-lumiere-1920.jpg" srcset="${R}img/hero-lumiere-1600.jpg 1600w, ${R}img/hero-lumiere-1920.jpg 1920w, ${R}img/hero-lumiere-2560.jpg 2560w" sizes="100vw" alt="" fetchpriority="high" decoding="async"></picture><video class="vid" muted playsinline loop preload="none" data-src="${R}v/hero-lumiere.mp4" data-src-m="${R}v/hero-lumiere-v.mp4" aria-hidden="true"></video></div>
  <div class="hshade" aria-hidden="true"></div>
  <div class="htext">
    ${t("p", "k", "SILAVU · Fine jewellery", "SILAVU · תכשיטי יוקרה")}
    <h1 class="h1" id="h1">The Line of <em>Desire</em></h1>
    <div class="acts"><a class="btn light" href="#collection"><span ${E("Discover the collection", "לגלות את הקולקציה")}>Discover the collection</span></a><button class="btn ghost" type="button" data-book><span ${E("Book a private viewing", "קביעת פגישה פרטית")}>Book a private viewing</span></button></div>
  </div>
</section>`;

  const intro = `<section class="intro rv" aria-labelledby="ih">
  ${t("p", "k", "The house", "הבית")}
  ${t("h2", "h2", "Seven pieces, <em>one hand.</em>", "שבעה תכשיטים, <em>יד אחת.</em>", ' id="ih"')}
  ${t("p", "p", "Every SILAVU piece can be seen in private. Tell the house what you are looking for, and a viewing will be arranged for you.", "כל תכשיט של SILAVU ניתן לראות באופן פרטי. ספרו לבית מה אתם מחפשים, ונתאם עבורכם פגישת צפייה.")}
</section>`;

  const sig = `<section id="collection" class="grid" aria-labelledby="sh">
  <header class="ghead rv">${t("p", "k", "The signature", "החתימה")}${t("h2", "h2", "The signature, <em>in white gold.</em>", "החתימה, <em>בזהב לבן.</em>", ' id="sh"')}</header>
  <ul class="cards c4">${SIG.map(card).join("")}</ul>
</section>`;

  const films = `<section id="soul" class="films" aria-labelledby="fh">
  <header class="fhead rv">${t("p", "k", "In motion", "בתנועה")}${t("h2", "h2", "Made to <em>catch the light.</em>", "נולדו <em>לתפוס את האור.</em>", ' id="fh"')}</header>
  ${FILMS.map(filmRow).join("\n  ")}
</section>`;

  const worn = `<section class="worn" aria-labelledby="wh">
  <header class="ghead rv">${t("p", "k", "Worn", "ענודים")}${t("h2", "h2", "Made to be <em>lived in.</em>", "נולדו <em>להיענד.</em>", ' id="wh"')}</header>
  <div class="wrow">
    <figure class="wfig rv"><a href="${R}pieces/pave/"><img src="${R}img/necklace-worn-900.jpg" srcset="${R}img/necklace-worn-640.jpg 640w, ${R}img/necklace-worn-900.jpg 900w, ${R}img/necklace-worn-1254.jpg 1254w" sizes="(max-width: 900px) 50vw, 33vw" width="1254" height="1254" alt="SILAVU SOUL, worn" data-alt-he="SILAVU SOUL, ענודה" loading="lazy" decoding="async"></a><figcaption><a href="${R}pieces/pave/">SILAVU SOUL</a></figcaption></figure>
    <figure class="wfig rv"><a href="${R}pieces/ring/"><img src="${R}img/ring-worn-900.jpg" srcset="${R}img/ring-worn-640.jpg 640w, ${R}img/ring-worn-900.jpg 900w, ${R}img/ring-worn-1254.jpg 1254w" sizes="(max-width: 900px) 50vw, 33vw" width="1254" height="1254" alt="SILAVU ICON, worn" data-alt-he="SILAVU ICON, ענודה" loading="lazy" decoding="async"></a><figcaption><a href="${R}pieces/ring/">SILAVU ICON</a></figcaption></figure>
    <figure class="wfig rv"><a href="${R}pieces/aura/"><img src="${R}img/aura-worn-900.jpg" srcset="${R}img/aura-worn-640.jpg 640w, ${R}img/aura-worn-900.jpg 900w, ${R}img/aura-worn-1254.jpg 1254w" sizes="(max-width: 900px) 50vw, 33vw" width="1254" height="1254" alt="SILAVU AURA, worn" data-alt-he="SILAVU AURA, ענודים" loading="lazy" decoding="async"></a><figcaption><a href="${R}pieces/aura/">SILAVU AURA</a></figcaption></figure>
  </div>
</section>`;

  const special = `<section id="special" class="grid" aria-labelledby="xh">
  <header class="ghead rv">${t("p", "k", "Special pieces", "פריטים מיוחדים")}${t("h2", "h2", "Rare <em>stones.</em>", "אבנים <em>נדירות.</em>", ' id="xh"')}</header>
  <ul class="cards c3">${SPECIAL.map(card).join("")}</ul>
</section>`;

  const appt = `<section id="appointment" class="appt" aria-labelledby="ah">
  <div class="abody rv">
    ${t("p", "k", "Dubai · Tel Aviv", "דובאי · תל אביב")}
    ${t("h2", "h2", "By <em>appointment.</em>", "<em>בתיאום</em> מראש.", ' id="ah"')}
    ${t("p", "p", "Every SILAVU piece can be seen in private. Tell the house what you are looking for, and a viewing will be arranged for you.", "כל תכשיט של SILAVU ניתן לראות באופן פרטי. ספרו לבית מה אתם מחפשים, ונתאם עבורכם פגישת צפייה.")}
    <div class="acts"><button class="btn light" type="button" data-book><span ${E("Book a private viewing", "קביעת פגישה פרטית")}>Book a private viewing</span></button><a class="btn ghost mail" href="mailto:concierge@silavu.com" dir="ltr">concierge@silavu.com</a></div>
  </div>
</section>`;

  const book = `<div class="sheet book" id="book" role="dialog" aria-modal="true" aria-labelledby="bookh" hidden>
  <div class="scrim" data-close></div>
  <div class="panel" tabindex="-1">
    <button class="close" type="button" data-close aria-label="Close" data-aria-he="סגירה"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    ${t("p", "k", "Dubai · Tel Aviv", "דובאי · תל אביב")}
    ${t("h2", "h2", "A private <em>viewing.</em>", "צפייה <em>פרטית.</em>", ' id="bookh"')}
    ${t("p", "p", "Choose the piece you would like to see. The house arranges every viewing in person, in Dubai or Tel Aviv.", "בחרו את התכשיט שתרצו לראות. הבית מתאם כל צפייה באופן אישי, בדובאי או בתל אביב.")}
    <fieldset class="bpieces"><legend class="k" ${E("The piece", "התכשיט")}>The piece</legend>
      ${LIST.map(p => `<label class="bp"><input type="radio" name="bpiece" id="bp-${p.id}" value="${p.id}" data-ref="${q((spec(p, "Reference") || {}).en || "")}" data-name="${q(plain(p.name.en))}"><span class="bpn" ${E(p.name.en, p.name.he)}>${p.name.en}</span><span class="bpr" dir="ltr">${q((spec(p, "Reference") || {}).en || "")}</span></label>`).join("")}
      <label class="bp"><input type="radio" name="bpiece" id="bp-open" value="" data-ref="" data-name=""><span class="bpn" ${E("Not decided yet", "עוד לא החלטתי")}>Not decided yet</span><span class="bpr"></span></label>
    </fieldset>
    <dl class="bsum"><dt ${E("Reference", "מק\"ט")}>Reference</dt><dd class="bref" dir="ltr">—</dd><dt ${E("Language", "שפה")}>Language</dt><dd class="blang">English</dd></dl>
    <div class="acts"><a class="btn dark bgo" href="${R}#concierge"><span ${E("Continue to the booking form", "המשך לטופס התיאום")}>Continue to the booking form</span></a><a class="btn line bmail" href="mailto:concierge@silavu.com"><span ${E("Write to the concierge", "כתבו לקונסיירז׳")}>Write to the concierge</span></a></div>
    ${t("p", "bnote", "The booking form opens with this piece already chosen, in your language. Nothing is sent until you send it.", "טופס התיאום ייפתח כשהתכשיט כבר נבחר, בשפה שלכם. דבר לא נשלח עד שתשלחו.")}
  </div>
</div>`;

  const LANGS = [["en", "EN", "English"], ["he", "עב", "עברית"], ["fr", "FR", "Français"], ["ar", "AR", "العربية"], ["ru", "RU", "Русский"]];
  const langBtns = cls => `<div class="${cls}" role="group" aria-label="Language" data-aria-he="שפה">${LANGS.map(([c, l, full]) => `<button type="button" data-lang="${c}" lang="${c}" aria-pressed="${c === "en"}" aria-label="${full}">${cls === "mlang" ? full : l}</button>`).join("")}</div>`;
  const NAV = [["#collection", "Collection", "קולקציה"], ["#soul", "In motion", "בתנועה"], ["#special", "Special pieces", "פריטים מיוחדים"], ["#appointment", "Appointment", "תיאום פגישה"]];
  const header = `<a class="skip" href="#collection" ${E("Skip to the collection", "דלגו לקולקציה")}>Skip to the collection</a>
<header class="hd" id="hd">
  <div class="hl"><button class="hmenu" type="button" aria-expanded="false" aria-controls="menu" aria-label="Menu" data-aria-he="תפריט"><i></i><i></i></button><nav class="nav" aria-label="Chapters" data-aria-he="פרקים">${NAV.slice(0, 3).map(([h, en, he]) => t("a", "", en, he, ` href="${h}"`)).join("")}</nav></div>
  <a class="brand" href="#top" aria-label="SILAVU">${markUse("hmk")}${logo("hlg")}</a>
  <div class="hr">${langBtns("lang")}<a class="hcoll" href="#collection"><span ${E("Collection", "קולקציה")}>Collection</span></a><button class="hbook" type="button" data-book><span ${E("Book an appointment", "קביעת פגישה")}>Book an appointment</span></button></div>
</header>
<div class="sheet menu" id="menu" role="dialog" aria-modal="true" aria-label="Menu" data-aria-he="תפריט" hidden>
  <div class="scrim" data-close></div>
  <div class="panel" tabindex="-1">
    <button class="close" type="button" data-close aria-label="Close" data-aria-he="סגירה"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <nav class="mnav" aria-label="Chapters" data-aria-he="פרקים">${NAV.map(([h, en, he]) => t("a", "", en, he, ` href="${h}" data-close`)).join("")}</nav>
    <button class="btn dark" type="button" data-book><span ${E("Book a private viewing", "קביעת פגישה פרטית")}>Book a private viewing</span></button>
    ${langBtns("mlang")}
  </div>
</div>`;
  const footer = `<footer class="ft">
  <p class="ftword" aria-hidden="true">${logo("flg")}</p>
  <div class="ftrow">
    <nav aria-label="The house" data-aria-he="הבית">${t("a", "", "About", "אודות", ` href="${R}about/"`)}${FOOTER_DOCS.slice(0, 4).map(d => t("a", "", d.title.en, d.title.he, ` href="${R}${d.slug}/"`)).join("")}</nav>
    <p class="k" ${E("Dubai · Tel Aviv · By appointment", "דובאי · תל אביב · בתיאום מראש")}>Dubai · Tel Aviv · By appointment</p>
    <p class="k"><span dir="ltr">© SILAVU <span class="fyr">${new Date().getFullYear()}</span></span></p>
  </div>
</footer>`;

  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>SILAVU · Fine jewellery</title>
<meta name="description" content="SILAVU fine jewellery: SOUL, ICON, MOMENT, AURA and the special pieces. Dubai · Tel Aviv · By appointment.">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#0b0b0b">
<link rel="icon" href="${R}favicon.ico?v=6" sizes="48x48 32x32 16x16">
<link rel="icon" href="${R}favicon.svg" type="image/svg+xml">
<link rel="preload" as="font" type="font/woff2" href="${font("bodoni-normal-latin")}" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="${font("jost-normal-latin")}" crossorigin>
<link rel="preload" as="image" fetchpriority="high" media="(min-aspect-ratio: 1/1)" href="${R}img/hero-lumiere-1920.jpg">
<link rel="preload" as="image" fetchpriority="high" media="(max-aspect-ratio: 1/1)" href="${R}img/hero-lumiere-v-1080.jpg">
<script>document.documentElement.classList.add("js")</script>
<style>
${faces}
${read("t9.css")}
</style>
</head>
<body>
${markDefs()}
${header}
<main id="main">
${hero}
${intro}
${sig}
${films}
${worn}
${special}
${appt}
</main>
${footer}
${book}
<script>
${read("t9.js")}
</script>
</body>
</html>
`;
}
