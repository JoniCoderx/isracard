/* /test8/: SILAVU as a product reel. One piece at a time, large, in front of
   its own name set enormous, on its own colour; the scroll brings the next
   one in, turning, as a lineup. Every picture is the house's own studio
   photograph, cut out (cut8.py), never redrawn. Anton (Karantina in Hebrew)
   for the names, Jost (Heebo in Hebrew) for the words, the wordmark in
   Urbanist. Styles in src/t8/t8.css, behaviour in src/t8/t8.js. */
import fs from "node:fs";
import path from "node:path";

export function test8Page({ PIECES, FOOTER_DOCS, markDefs, markUse, logo, root }) {
  const R = "../";
  const q = v => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const E = (en, he) => `data-en="${q(en)}" data-he="${q(he)}"`;
  const t = (tag, cls, en, he, extra = "") => `<${tag}${cls ? ` class="${cls}"` : ""} ${E(en, he)}${extra}>${en}</${tag}>`;
  const P = id => PIECES.find(p => p.id === id);
  const spec = (p, label) => { const r = (p.specs || []).find(x => x[0].en === label); return r ? r[1] : null; };
  const fontsDir = path.join(root, "public/fonts");
  const font = k => { const f = fs.readdirSync(fontsDir).find(x => x.startsWith(k + "-") && /-[0-9a-f]{6}\.woff2$/.test(x)); if (!f) throw new Error("test8: font " + k + " missing"); return R + "fonts/" + f; };
  const LATIN = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
  const LATINX = "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF";
  const HEB = "U+0307-0308, U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F";
  const CYR = "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116";
  const face = (fam, w, file, range) => `@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:swap;src:url(${file}) format('woff2');unicode-range:${range}}`;
  const faces = [
    face("Silavu Bold", "400", font("anton-normal-latin"), LATIN), face("Silavu Bold", "400", font("anton-normal-latin-ext"), LATINX), face("Silavu Bold", "400", font("karantina-bold-hebrew"), HEB),
    face("Silavu Text", "300 600", font("jost-normal-latin"), LATIN), face("Silavu Text", "300 600", font("jost-normal-latin-ext"), LATINX), face("Silavu Text", "300 600", font("jost-normal-cyrillic"), CYR),
    face("Silavu Text", "300 600", font("heebo-normal-hebrew"), HEB),
    face("Urbanist", "500", font("urbanist-normal-all"), "U+41, U+49, U+4c, U+53, U+55-56, U+61, U+69, U+6c, U+73, U+75-76")
  ].join("\n");
  const read = f => fs.readFileSync(path.join(root, "src", "t8", f), "utf8");
  const plain = s => s.replace(/<[^>]+>/g, "");
  const short = s => plain(s).replace(/^SILAVU\s+/, "");
  const LIST = PIECES.filter(p => p.id && !p.exceptional);
  const SIG = ["knot", "ring", "pave", "aura"];
  /* each piece, its colour and the deep tone of its name */
  const SCENES = [["ring", "#bed6ec", "#163460"], ["knot", "#d9cdea", "#3d2766"], ["pave", "#f2c4cf", "#7a1f3d"], ["aura", "#c4dece", "#184e34"], ["blush", "#f6e2aa", "#78480a"], ["promise", "#f1e6d2", "#5a3a12"], ["cadence", "#d4e2e8", "#1d3a46"]]
    .map(([id, bg, ink]) => ({ p: P(id), id, bg, ink })).filter(s => s.p);
  if (SCENES.length < 4 || !P("pave")) return null;
  const cut = (id, sizes, cls, eager) => `<img class="${cls}" src="${R}cut8/${id}-700.webp" srcset="${R}cut8/${id}-700.webp 700w, ${R}cut8/${id}-1200.webp 1200w" sizes="${sizes}" alt="" decoding="async"${eager ? ' fetchpriority="high"' : ' loading="lazy"'}>`;
  const kind = p => [(SIG.includes(p.id) ? "The signature · " : "Special pieces · ") + p.kind.en, (SIG.includes(p.id) ? "החתימה · " : "פריטים מיוחדים · ") + p.kind.he];
  const soul = P("pave");

  /* 0 · the opening: SOUL, close, in front of the house's name */
  const hero = `<section id="top" class="hero" style="--bg:#f2c4cf;--ink:#7a1f3d" data-ink="#7a1f3d" aria-labelledby="h1">
  <p class="giant" aria-hidden="true">SILAVU</p>
  <div class="hpiece"><img class="hcut" src="${R}cut8/pave-hero-1200.webp" srcset="${R}cut8/pave-hero-700.webp 700w, ${R}cut8/pave-hero-1200.webp 1200w" sizes="(max-aspect-ratio: 1/1) 92vw, 46vw" alt="${q(plain(soul.name.en))}, ${q(soul.kind.en)}" data-alt-he="${q(plain(soul.name.he))}" fetchpriority="high" decoding="async"></div>
  <div class="htext">
    ${t("p", "k", "SILAVU SOUL · Fine jewellery · Dubai · Tel Aviv", "SILAVU SOUL · תכשיטי יוקרה · דובאי · תל אביב")}
    <h1 class="h1" id="h1" ${E("The Line of Desire", "The Line of Desire")}>The Line of Desire</h1>
  </div>
  <div class="hacts acts"><a class="btn solid" href="#collection"><span ${E("Discover the collection", "לגלות את הקולקציה")}>Discover the collection</span></a><button class="btn line" type="button" data-book="pave"><span ${E("Book a viewing", "תיאום צפייה")}>Book a viewing</span></button></div>
</section>`;

  /* 1 · the lineup: one piece at a time, the scroll brings the next */
  /* the name as wide as the screen allows, whatever its length */
  const nameSize = s => Math.min(34, 132 / short(s.p.name.en).length).toFixed(1) + "vw";
  const scene = (s, i) => `<article class="sc" id="p-${s.id}" data-i="${i}" style="--bg:${s.bg};--ink:${s.ink};--fs:${nameSize(s)}" aria-roledescription="slide" aria-label="${i + 1} / ${SCENES.length}">
      <div class="scbg" aria-hidden="true"></div>
      <p class="scname" aria-hidden="true">${q(short(s.p.name.en))}</p>
      <div class="scpiece">${cut(s.id === "pave" ? "pave-hero" : s.id, "(max-aspect-ratio: 1/1) 86vw, 52vw", "sccut", i === 0)}</div>
      <div class="scinfo">
        ${t("p", "k", ...kind(s.p))}
        <h3 class="scn"><a href="${R}pieces/${s.id}/" ${E(s.p.name.en, s.p.name.he)}>${s.p.name.en}</a></h3>
        ${s.p.line ? t("p", "p", s.p.line.en, s.p.line.he) : ""}
        <p class="ref" dir="ltr">${q((spec(s.p, "Reference") || {}).en || "")}</p>
        <div class="acts"><a class="btn solid" href="${R}pieces/${s.id}/"><span ${E("View the piece", "לצפייה בתכשיט")}>View the piece</span></a><button class="btn line" type="button" data-book="${s.id}"><span ${E("Book a viewing", "תיאום צפייה")}>Book a viewing</span></button></div>
      </div>
    </article>`;
  const lineup = `<section id="collection" class="lineup" aria-roledescription="carousel" aria-label="The collection" data-aria-he="הקולקציה" data-n="${SCENES.length}" data-inks="${q(JSON.stringify(SCENES.map(s => s.ink)))}">
  <div class="lpin" style="--n:${SCENES.length}"><div class="lstage">
    ${SCENES.map(scene).join("\n    ")}
    <nav class="lnav" aria-label="The pieces" data-aria-he="התכשיטים">
      <button class="lstep lprev" type="button" aria-label="Previous piece" data-aria-he="התכשיט הקודם"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
      <div class="lpills">${SCENES.map((s, i) => `<button class="lpill" type="button" data-i="${i}"${i ? "" : ' aria-current="true"'}>${q(short(s.p.name.en))}</button>`).join("")}</div>
      <button class="lstep lnext" type="button" aria-label="Next piece" data-aria-he="התכשיט הבא"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
    </nav>
  </div></div>
</section>`;

  /* 2 · all of them at once, each one tap from its page */
  const grid = `<section id="all" class="all" aria-labelledby="allh">
  <header class="allhead">${t("h2", "big", "The lineup.", "כל הקולקציה.", ' id="allh"')}${t("p", "p", "Seven pieces, one hand. Each can be seen in private, in Dubai or Tel Aviv.", "שבעה תכשיטים, יד אחת. כל אחד מהם ניתן לראות באופן פרטי, בדובאי או בתל אביב.")}</header>
  <ul class="tiles">${SCENES.map(s => `<li class="tile" style="--bg:${s.bg};--ink:${s.ink}"><a href="${R}pieces/${s.id}/"><span class="tcut">${cut(s.id, "(max-width: 760px) 80vw, 26vw", "", false)}</span><span class="tname">${q(short(s.p.name.en))}</span><span class="tkind" ${E(s.p.kind.en, s.p.kind.he)}>${s.p.kind.en}</span></a></li>`).join("")}</ul>
</section>`;

  /* 3 · by appointment */
  const appt = `<section id="appointment" class="appt" aria-labelledby="ah">
  ${t("h2", "big", "By appointment.", "בתיאום מראש.", ' id="ah"')}
  <div class="abody">
    ${t("p", "k", "Dubai · Tel Aviv", "דובאי · תל אביב")}
    ${t("p", "p", "Every SILAVU piece can be seen in private. Tell the house what you are looking for, and a viewing will be arranged for you.", "כל תכשיט של SILAVU ניתן לראות באופן פרטי. ספרו לבית מה אתם מחפשים, ונתאם עבורכם פגישת צפייה.")}
    <div class="acts"><button class="btn solid" type="button" data-book><span ${E("Book a private viewing", "קביעת פגישה פרטית")}>Book a private viewing</span></button><a class="btn line mail" href="mailto:concierge@silavu.com" dir="ltr">concierge@silavu.com</a></div>
  </div>
  <img class="acut" src="${R}cut8/pave-700.webp" alt="" loading="lazy" decoding="async">
</section>`;

  const book = `<div class="sheet book" id="book" role="dialog" aria-modal="true" aria-labelledby="bookh" hidden>
  <div class="scrim" data-close></div>
  <div class="panel" tabindex="-1">
    <button class="close" type="button" data-close aria-label="Close" data-aria-he="סגירה"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    ${t("p", "k", "Dubai · Tel Aviv", "דובאי · תל אביב")}
    ${t("h2", "bigs", "A private viewing.", "צפייה פרטית.", ' id="bookh"')}
    ${t("p", "p", "Choose the piece you would like to see. The house arranges every viewing in person, in Dubai or Tel Aviv.", "בחרו את התכשיט שתרצו לראות. הבית מתאם כל צפייה באופן אישי, בדובאי או בתל אביב.")}
    <fieldset class="bpieces"><legend class="k" ${E("The piece", "התכשיט")}>The piece</legend>
      ${LIST.map(p => `<label class="bp"><input type="radio" name="bpiece" id="bp-${p.id}" value="${p.id}" data-ref="${q((spec(p, "Reference") || {}).en || "")}" data-name="${q(plain(p.name.en))}"><span class="bpn" ${E(p.name.en, p.name.he)}>${p.name.en}</span><span class="bpr" dir="ltr">${q((spec(p, "Reference") || {}).en || "")}</span></label>`).join("")}
      <label class="bp"><input type="radio" name="bpiece" id="bp-open" value="" data-ref="" data-name=""><span class="bpn" ${E("Not decided yet", "עוד לא החלטתי")}>Not decided yet</span><span class="bpr"></span></label>
    </fieldset>
    <dl class="bsum"><dt ${E("Reference", "מק\"ט")}>Reference</dt><dd class="bref" dir="ltr">—</dd><dt ${E("Language", "שפה")}>Language</dt><dd class="blang">English</dd></dl>
    <div class="acts"><a class="btn solid bgo" href="${R}#concierge"><span ${E("Continue to the booking form", "המשך לטופס התיאום")}>Continue to the booking form</span></a><a class="btn line bmail" href="mailto:concierge@silavu.com"><span ${E("Write to the concierge", "כתבו לקונסיירז׳")}>Write to the concierge</span></a></div>
    ${t("p", "bnote", "The booking form opens with this piece already chosen, in your language. Nothing is sent until you send it.", "טופס התיאום ייפתח כשהתכשיט כבר נבחר, בשפה שלכם. דבר לא נשלח עד שתשלחו.")}
  </div>
</div>`;

  const LANGS = [["en", "EN", "English"], ["he", "עב", "עברית"], ["fr", "FR", "Français"], ["ar", "AR", "العربية"], ["ru", "RU", "Русский"]];
  const langBtns = cls => `<div class="${cls}" role="group" aria-label="Language" data-aria-he="שפה">${LANGS.map(([c, l, full]) => `<button type="button" data-lang="${c}" lang="${c}" aria-pressed="${c === "en"}" aria-label="${full}">${cls === "mlang" ? full : l}</button>`).join("")}</div>`;
  const NAV = [["#collection", "Collection", "קולקציה"], ["#all", "The lineup", "כל התכשיטים"], ["#appointment", "Appointment", "תיאום פגישה"]];
  const header = `<a class="skip" href="#collection" ${E("Skip to the collection", "דלגו לקולקציה")}>Skip to the collection</a>
<header class="hd" id="hd">
  <a class="brand" href="#top" aria-label="SILAVU">${markUse("hmk")}${logo("hlg")}</a>
  <nav class="nav" aria-label="Chapters" data-aria-he="פרקים">${NAV.map(([h, en, he]) => t("a", "", en, he, ` href="${h}"`)).join("")}</nav>
  <div class="hact">${langBtns("lang")}<a class="hcoll" href="#collection"><span ${E("Collection", "קולקציה")}>Collection</span></a><button class="hbook" type="button" data-book><span ${E("Book", "תיאום")}>Book</span></button><button class="hmenu" type="button" aria-expanded="false" aria-controls="menu" aria-label="Menu" data-aria-he="תפריט"><i></i><i></i></button></div>
</header>
<div class="sheet menu" id="menu" role="dialog" aria-modal="true" aria-label="Menu" data-aria-he="תפריט" hidden>
  <div class="scrim" data-close></div>
  <div class="panel" tabindex="-1">
    <button class="close" type="button" data-close aria-label="Close" data-aria-he="סגירה"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <nav class="mnav" aria-label="Chapters" data-aria-he="פרקים">${NAV.map(([h, en, he]) => t("a", "", en, he, ` href="${h}" data-close`)).join("")}</nav>
    <button class="btn solid" type="button" data-book><span ${E("Book a private viewing", "קביעת פגישה פרטית")}>Book a private viewing</span></button>
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
<meta name="theme-color" content="#f2c4cf">
<meta name="color-scheme" content="light">
<link rel="icon" href="${R}favicon.ico?v=6" sizes="48x48 32x32 16x16">
<link rel="icon" href="${R}favicon.svg" type="image/svg+xml">
<link rel="preload" as="font" type="font/woff2" href="${font("anton-normal-latin")}" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="${font("jost-normal-latin")}" crossorigin>
<link rel="preload" as="image" fetchpriority="high" href="${R}cut8/pave-hero-1200.webp" imagesrcset="${R}cut8/pave-hero-700.webp 700w, ${R}cut8/pave-hero-1200.webp 1200w" imagesizes="(max-aspect-ratio: 1/1) 92vw, 46vw">
<style>
${faces}
${read("t8.css")}
</style>
</head>
<body>
${markDefs()}
${header}
<main id="main">
${hero}
${lineup}
${grid}
${appt}
</main>
${footer}
${book}
<script>
${read("t8.js")}
</script>
</body>
</html>
`;
}
