/* /test6/: SILAVU in white. The house's own film opens the page (the four
   pieces on white marble, her hand lifting SOUL); SOUL then becomes the
   story, rendered from the house's exact geometry in a white studio
   (soul6-frames.mjs): an extreme close-up of polished white gold drawn back
   behind the oversized name, the turn, the diamonds settling, the pavé up
   close; the render meets the film of SOUL worn on skin and the film plays
   on. Then the collection on one porcelain light (studio6.py), and the
   appointment. Cormorant Garamond and Frank Ruhl Libre for the voice, Jost
   and Heebo for the words, in Latin and Hebrew alike; the wordmark in
   Urbanist. Styles in src/t6/t6.css, behaviour in src/t6/t6.js. */
import fs from "node:fs";
import path from "node:path";

export function test6Page({ PIECES, FOOTER_DOCS, markDefs, markUse, logo, META, root }) {
  const R = "../";
  const q = v => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const E = (en, he) => `data-en="${q(en)}" data-he="${q(he)}"`;
  const t = (tag, cls, en, he, extra = "") => `<${tag}${cls ? ` class="${cls}"` : ""} ${E(en, he)}${extra}>${en}</${tag}>`;
  const P = id => PIECES.find(p => p.id === id);
  const spec = (p, label) => { const r = (p.specs || []).find(x => x[0].en === label); return r ? r[1] : null; };
  const soul = P("pave"); if (!soul) return null;
  const ref = spec(soul, "Reference"); if (!ref) return null;
  const fontsDir = path.join(root, "public/fonts");
  const font = k => { const f = fs.readdirSync(fontsDir).find(x => x.startsWith(k + "-") && /-[0-9a-f]{6}\.woff2$/.test(x)); if (!f) throw new Error("test6: font " + k + " missing"); return R + "fonts/" + f; };
  const LATIN = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
  const LATINX = "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF";
  const HEB = "U+0307-0308, U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F";
  const CYR = "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116";
  const face = (fam, w, file, range, style = "normal") => `@font-face{font-family:'${fam}';font-style:${style};font-weight:${w};font-display:swap;src:url(${file}) format('woff2');unicode-range:${range}}`;
  /* one family per voice, its Hebrew drawn by a sister face */
  const faces = [
    face("Silavu Display", "300 600", font("cormorant-normal-latin"), LATIN), face("Silavu Display", "300 600", font("cormorant-normal-latin-ext"), LATINX),
    face("Silavu Display", "300 500", font("cormorant-italic-latin"), LATIN, "italic"), face("Silavu Display", "300 500", font("frank-normal-hebrew"), HEB),
    face("Silavu Text", "300 600", font("jost-normal-latin"), LATIN), face("Silavu Text", "300 600", font("jost-normal-latin-ext"), LATINX), face("Silavu Text", "300 600", font("jost-normal-cyrillic"), CYR),
    face("Silavu Text", "300 600", font("heebo-normal-hebrew"), HEB),
    face("Urbanist", "500", font("urbanist-normal-all"), "U+41, U+49, U+4c, U+53, U+55-56, U+61, U+69, U+6c, U+73, U+75-76")
  ].join("\n");
  const read = f => fs.readFileSync(path.join(root, "src", "t6", f), "utf8");
  const nameTxt = p => p.name.en.replace(/<[^>]+>/g, "");
  const LIST = PIECES.filter(p => p.id && !p.exceptional);
  const SIG = ["knot", "ring", "pave", "aura"], SPECIAL = ["promise", "blush", "cadence"];
  const ORDER = [...SIG, ...SPECIAL].map(P).filter(Boolean);
  /* where SOUL is in the first frame of the film of it worn (measured on
     hero-lumiere-1920.jpg and hero-lumiere-v-1080.jpg): centre and height */
  const WORN = { d: [0.501, 0.506, 0.365], m: [0.509, 0.408, 0.295] };
  const wornAlt = ((soul.shots || []).find(s => s.img === "necklace-worn") || {}).alt || { en: "", he: "" };

  /* 0 · the house's film: the four pieces on white marble, her hand lifts
     SOUL, then SOUL at her throat */
  const hero = `<section id="top" class="hero" aria-labelledby="h1">
  <div class="hfilm">
    <picture><source media="(max-aspect-ratio: 1/1)" srcset="${R}img/hero-choice-v-1080.jpg"><img class="hpost" src="${R}img/hero-choice-1920.jpg" alt="SILAVU jewellery on white marble: a hand lifts the SOUL necklace" data-alt-he="יד מרימה את שרשרת SILAVU SOUL מעל שיש לבן" fetchpriority="high" decoding="async"></picture>
    <video class="hvid" muted playsinline loop preload="none" data-src="${R}v/hero-choice.mp4" data-src-m="${R}v/hero-choice-v.mp4" aria-hidden="true"></video>
    <div class="hwash" aria-hidden="true"></div>
  </div>
  <div class="htext">
    ${t("p", "k", "SILAVU · Fine jewellery · Dubai · Tel Aviv", "SILAVU · תכשיטי יוקרה · דובאי · תל אביב")}
    <h1 class="h1" id="h1"><span ${E("The Line", "The Line")}>The Line</span> <em ${E("of Desire", "of Desire")}>of Desire</em></h1>
    <div class="acts"><a class="btn ink" href="#collection"><span ${E("Discover the collection", "לגלות את הקולקציה")}>Discover the collection</span></a><a class="btn line" href="#soul"><span ${E("Meet SOUL", "להכיר את SOUL")}>Meet SOUL</span></a></div>
  </div>
  <a class="hcue" href="#soul" aria-label="To SOUL" data-aria-he="אל SOUL"><i></i></a>
</section>`;

  /* 1 · SOUL: the story, played by the scroll */
  const beat = (inner, cls = "") => `<div class="beat${cls}">${inner}</div>`;
  const soulScene = `<section id="soul" class="soul" aria-label="SILAVU SOUL" data-n="150" data-base="${R}f/soul6/" data-meta="${q(JSON.stringify(META))}" data-worn="${q(JSON.stringify(WORN))}" data-stages="0.17,0.27,0.46,0.66">
  <div class="spin"><div class="stage">
    <img class="spost" src="${R}f/soul6/d-000.jpg" data-tall="${R}f/soul6/m-000.jpg" alt="" decoding="async">
    <canvas class="scv" role="img" aria-label="The SILAVU SOUL necklace in white gold: from an extreme close-up of its polished metal the camera draws back to the whole pendant, which turns to show its depth while its pavé diamonds lift and settle into their seats; the camera moves in close to the pavé, then back, to SOUL worn" data-aria-he="שרשרת SILAVU SOUL בזהב לבן: מקרוב מאוד אל המתכת המלוטשת המצלמה מתרחקת אל התליון כולו, שמסתובב ומראה את עומקו בזמן שיהלומי הפאווה מתרוממים וחוזרים למושביהם; המצלמה מתקרבת אל הפאווה, וחוזרת אל SOUL כשהיא ענודה"></canvas>
    <img class="wpost" alt="${q(wornAlt.en)}" data-alt-he="${q(wornAlt.he)}" data-src="${R}img/hero-lumiere-1920.jpg" data-src-m="${R}img/hero-lumiere-v-1080.jpg" decoding="async">
    <video class="wvid" muted playsinline loop preload="none" data-src="${R}v/hero-lumiere.mp4" data-src-m="${R}v/hero-lumiere-v.mp4" aria-hidden="true"></video>
    <div class="shade" aria-hidden="true"></div>
    <div class="cap">${t("p", "k", "SILAVU SOUL · " + ref.en, "SILAVU SOUL · " + ref.he)}<p class="capl" ${E("Scroll", "גללו")}>Scroll</p></div>
    <div class="beats">
      ${beat(`${t("p", "k", "SILAVU SOUL", "SILAVU SOUL")}${t("h2", "h2", "The signature, <em>in three dimensions.</em>", "החתימה, <em>בתלת־ממד.</em>")}${t("p", "p", "Polished walls rise around the pavé, so the mark catches the light from every side.", "דפנות מלוטשות עולות סביב הפאווה, כך שהחותם תופס את האור מכל צד.")}`)}
      ${beat(`${t("p", "k", "Pavé", "פאווה")}${t("h2", "h2", "Every stone, <em>in its seat.</em>", "כל אבן, <em>במושב שלה.</em>")}${t("p", "p", "Pavé diamonds run along both strands and both crescents, each held by fine beads of white gold.", "יהלומי פאווה לאורך שני הגדילים ושני הסהרונים, כל אחד מוחזק בחרוזים עדינים של זהב לבן.")}`)}
      ${beat(`${t("p", "k", "Set by hand", "משובץ ביד")}${t("h2", "h2", "Up close, <em>the craft.</em>", "מקרוב, <em>המלאכה.</em>")}${t("p", "p", "Smaller stones where the strands narrow, larger where they open.", "אבנים קטנות יותר במקום שבו הגדילים צרים, וגדולות יותר במקום שבו הם נפתחים.")}`)}
      ${beat(`${t("p", "k", ref.en, ref.he)}${t("h2", "h2", "Made to be <em>lived in.</em>", "נולדה <em>להיענד.</em>")}${t("p", "p", "Made to order, in 18K white gold.", "מיוצרת לפי הזמנה, בזהב לבן 18K.")}<div class="acts"><a class="btn ink" href="${R}pieces/pave/"><span ${E("View SOUL", "לצפייה ב־SOUL")}>View SOUL</span></a><button class="btn line" type="button" data-book="pave"><span ${E("Book a viewing", "תיאום צפייה")}>Book a viewing</span></button></div>`, " last")}
    </div>
    <div class="prog" aria-hidden="true"><i></i></div>
  </div></div>
</section>`;

  /* 2 · the collection: one piece in front, large, with its particulars and
     the two ways to see it; every other piece in its place along the rail,
     one tap from the front */
  const img = (id, tag, cls, sizes, lazy = true) => `<img class="${cls}" src="${R}studio6/${id}-${tag}-700.webp" srcset="${R}studio6/${id}-${tag}-700.webp 700w, ${R}studio6/${id}-${tag}-1200.webp 1200w" sizes="${sizes}" width="1200" height="1200" alt="" decoding="async"${lazy ? ' loading="lazy"' : ""}>`;
  const specRows = p => (p.specs || []).filter(r => r[0].en !== "Price" && r[0].en !== "Reference").slice(0, 3).map(([k, v]) => `<dt ${E(k.en, k.he)}>${k.en}</dt><dd ${E(v.en, v.he)}>${v.en}</dd>`).join("");
  const kind = p => [(SIG.includes(p.id) ? "The signature · " : "Special pieces · ") + p.kind.en, (SIG.includes(p.id) ? "החתימה · " : "פריטים מיוחדים · ") + p.kind.he];
  const feature = (p, i) => `<article class="gpiece" id="g-${p.id}" data-i="${i}" data-group="${SIG.includes(p.id) ? "sig" : "special"}" aria-roledescription="slide" aria-label="${i + 1} / ${ORDER.length}"${i ? " hidden" : ""}>
      <div class="gfig">${img(p.id, "a", "ga", "(max-width: 899px) 92vw, 50vw")}${img(p.id, "b", "gb", "(max-width: 899px) 92vw, 50vw")}<button class="gturn" type="button" aria-pressed="false"><span ${E("Another angle", "זווית נוספת")}>Another angle</span></button></div>
      <div class="ginfo">
        ${t("p", "k", ...kind(p))}
        <h3 class="gname"><a href="${R}pieces/${p.id}/" ${E(p.name.en, p.name.he)}>${p.name.en}</a></h3>
        ${p.line ? t("p", "p", p.line.en, p.line.he) : ""}
        <dl class="specs">${specRows(p)}${spec(p, "Reference") ? `<dt ${E("Reference", "מק\"ט")}>Reference</dt><dd dir="ltr">${q(spec(p, "Reference").en)}</dd>` : ""}</dl>
        <div class="acts"><a class="btn ink" href="${R}pieces/${p.id}/"><span ${E("View the piece", "לצפייה בתכשיט")}>View the piece</span></a><button class="btn line" type="button" data-book="${p.id}"><span ${E("Book a viewing", "תיאום צפייה")}>Book a viewing</span></button></div>
      </div>
    </article>`;
  const gallery = `<section id="collection" class="gallery" aria-roledescription="carousel" aria-labelledby="gh">
  <header class="ghead">
    <div>${t("p", "k", "The collection", "הקולקציה")}${t("h2", "h2", "Seven pieces, <em>one hand.</em>", "שבעה תכשיטים, <em>יד אחת.</em>", ' id="gh"')}</div>
    <div class="gfilter" role="group" aria-label="Show" data-aria-he="הצגה">${[["all", "All", "הכול"], ["sig", "The signature", "החתימה"], ["special", "Special pieces", "פריטים מיוחדים"]].map(([k, en, he], i) => `<button type="button" data-f="${k}" aria-pressed="${!i}" ${E(en, he)}>${en}</button>`).join("")}</div>
  </header>
  <div class="gstage">${ORDER.map(feature).join("")}</div>
  <div class="gnav">
    <button class="gstep gprev" type="button" aria-label="Previous piece" data-aria-he="התכשיט הקודם"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
    <div class="gthumbs">${ORDER.map((p, i) => `<button class="gthumb" type="button" data-i="${i}" data-group="${SIG.includes(p.id) ? "sig" : "special"}" aria-label="${q(nameTxt(p))}"${i ? "" : ' aria-current="true"'}>${img(p.id, "a", "", "132px", false)}<span ${E(p.name.en.replace(/^SILAVU\s+/, ""), p.name.he.replace(/^SILAVU\s+/, ""))}>${p.name.en.replace(/^SILAVU\s+/, "")}</span></button>`).join("")}</div>
    <button class="gstep gnext" type="button" aria-label="Next piece" data-aria-he="התכשיט הבא"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
    <p class="gnum" aria-live="polite"><b>01</b> / ${String(ORDER.length).padStart(2, "0")}</p>
  </div>
</section>`;

  /* 3 · by appointment */
  const appt = `<section id="appointment" class="appt" aria-labelledby="ah">
  <div class="amark" aria-hidden="true">${markUse("amk")}</div>
  <div class="abody">
    ${t("p", "k", "Dubai · Tel Aviv", "דובאי · תל אביב")}
    ${t("h2", "h2", "By <em>appointment.</em>", "<em>בתיאום</em> מראש.", ' id="ah"')}
    ${t("p", "p", "Every SILAVU piece can be seen in private. Tell the house what you are looking for, and a viewing will be arranged for you.", "כל תכשיט של SILAVU ניתן לראות באופן פרטי. ספרו לבית מה אתם מחפשים, ונתאם עבורכם פגישת צפייה.")}
    <div class="acts"><button class="btn ink" type="button" data-book><span ${E("Book a private viewing", "קביעת פגישה פרטית")}>Book a private viewing</span></button><a class="btn line mail" href="mailto:concierge@silavu.com" dir="ltr">concierge@silavu.com</a></div>
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
      ${LIST.map(p => `<label class="bp"><input type="radio" name="bpiece" id="bp-${p.id}" value="${p.id}" data-ref="${q((spec(p, "Reference") || {}).en || "")}" data-name="${q(nameTxt(p))}"><span class="bpn" ${E(p.name.en, p.name.he)}>${p.name.en}</span><span class="bpr" dir="ltr">${q((spec(p, "Reference") || {}).en || "")}</span></label>`).join("")}
      <label class="bp"><input type="radio" name="bpiece" id="bp-open" value="" data-ref="" data-name=""><span class="bpn" ${E("Not decided yet", "עוד לא החלטתי")}>Not decided yet</span><span class="bpr"></span></label>
    </fieldset>
    <dl class="specs bsum"><dt ${E("Reference", "מק\"ט")}>Reference</dt><dd class="bref" dir="ltr">—</dd><dt ${E("Language", "שפה")}>Language</dt><dd class="blang">English</dd></dl>
    <div class="acts"><a class="btn ink bgo" href="${R}#concierge"><span ${E("Continue to the booking form", "המשך לטופס התיאום")}>Continue to the booking form</span></a><a class="btn line bmail" href="mailto:concierge@silavu.com"><span ${E("Write to the concierge", "כתבו לקונסיירז׳")}>Write to the concierge</span></a></div>
    ${t("p", "bnote", "The booking form opens with this piece already chosen, in your language. Nothing is sent until you send it.", "טופס התיאום ייפתח כשהתכשיט כבר נבחר, בשפה שלכם. דבר לא נשלח עד שתשלחו.")}
  </div>
</div>`;

  const LANGS = [["en", "EN", "English"], ["he", "עב", "עברית"], ["fr", "FR", "Français"], ["ar", "AR", "العربية"], ["ru", "RU", "Русский"]];
  const langBtns = cls => `<div class="${cls}" role="group" aria-label="Language" data-aria-he="שפה">${LANGS.map(([c, l, full]) => `<button type="button" data-lang="${c}" lang="${c}" aria-pressed="${c === "en"}" aria-label="${full}">${cls === "mlang" ? full : l}</button>`).join("")}</div>`;
  const NAV = [["#soul", "SOUL", "SOUL"], ["#collection", "Collection", "קולקציה"], ["#appointment", "Appointment", "תיאום פגישה"]];
  /* the bar stays: the collection is always one tap away */
  const header = `<a class="skip" href="#collection" ${E("Skip to the collection", "דלגו לקולקציה")}>Skip to the collection</a>
<header class="hd" id="hd">
  <a class="brand" href="#top" aria-label="SILAVU">${markUse("hmk")}${logo("hlg")}</a>
  <nav class="nav" aria-label="Chapters" data-aria-he="פרקים">${NAV.map(([h, en, he]) => t("a", "", en, he, ` href="${h}"`)).join("")}</nav>
  <div class="hact">${langBtns("lang")}<a class="hcoll" href="#collection"><span ${E("Collection", "קולקציה")}>Collection</span></a><button class="hbook" type="button" data-book><span ${E("Private appointment", "פגישה פרטית")}>Private appointment</span></button><button class="hmenu" type="button" aria-expanded="false" aria-controls="menu" aria-label="Menu" data-aria-he="תפריט"><i></i><i></i></button></div>
</header>
<div class="sheet menu" id="menu" role="dialog" aria-modal="true" aria-label="Menu" data-aria-he="תפריט" hidden>
  <div class="scrim" data-close></div>
  <div class="panel" tabindex="-1">
    <button class="close" type="button" data-close aria-label="Close" data-aria-he="סגירה"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <nav class="mnav" aria-label="Chapters" data-aria-he="פרקים">${NAV.map(([h, en, he]) => t("a", "", en, he, ` href="${h}" data-close`)).join("")}</nav>
    <button class="btn ink" type="button" data-book><span ${E("Book a private viewing", "קביעת פגישה פרטית")}>Book a private viewing</span></button>
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
<meta name="description" content="SILAVU fine jewellery: SOUL in white gold and pavé diamonds, and the collection. Dubai · Tel Aviv · By appointment.">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#faf9f7">
<meta name="color-scheme" content="light">
<link rel="icon" href="${R}favicon.ico?v=6" sizes="48x48 32x32 16x16">
<link rel="icon" href="${R}favicon.svg" type="image/svg+xml">
<link rel="preload" as="font" type="font/woff2" href="${font("cormorant-normal-latin")}" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="${font("jost-normal-latin")}" crossorigin>
<link rel="preload" as="image" fetchpriority="high" media="(min-aspect-ratio: 1/1)" href="${R}img/hero-choice-1920.jpg">
<link rel="preload" as="image" fetchpriority="high" media="(max-aspect-ratio: 1/1)" href="${R}img/hero-choice-v-1080.jpg">
<style>
${faces}
${read("t6.css")}
</style>
</head>
<body>
${markDefs()}
${header}
<main id="main">
${hero}
${soulScene}
${gallery}
${appt}
</main>
${footer}
${book}
<script>
${read("t6.js")}
</script>
</body>
</html>
`;
}
