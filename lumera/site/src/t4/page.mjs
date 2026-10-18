/* /test4/ (owner, 18 Oct 2026: "build it from zero, crazy, charming,
   amazing, so people say: what is this, I'm in love"). A page of its own,
   not the home page rearranged: its own type (Bodoni Moda, Frank Ruhl Libre
   for Hebrew), its own chapters, and only the house's real material: the
   LUMIÈRE film, the SOUL frames, the piece photographs, the exact mark, and
   the pieces' own words and specs (src/pieces.mjs). The one thing drawn
   rather than photographed is the round brilliant in "The cut": a diagram
   of the cut, worked out live (src/t4/gem.js), and said to be so on the page.
   Styles in src/t4/t4.css, behaviour in src/t4/t4.js. */
import fs from "node:fs";
import path from "node:path";

export function test4Page({ PIECES, FOOTER_DOCS, mark, markDefs, markUse, logo, CX, root }) {
  const R = "../";
  const q = v => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const E = (en, he) => `data-en="${q(en)}" data-he="${q(he)}"`;
  const t = (tag, cls, en, he, extra = "") => `<${tag}${cls ? ` class="${cls}"` : ""} ${E(en, he)}${extra}>${en}</${tag}>`;
  const P = id => PIECES.find(p => p.id === id);
  const soul = P("pave");
  if (!soul) return null;
  const spec = (p, label) => { const r = (p.specs || []).find(x => x[0].en === label); return r ? r[1] : null; };
  const metal = spec(soul, "Metal"), setting = spec(soul, "Setting"), length = spec(soul, "Length"), ref = spec(soul, "Reference");
  const chain = (soul.key || []).find(x => x[0].en === "Diamonds");
  if (!metal || !setting || !length || !ref || !chain) return null;
  const fontsDir = path.join(root, "public/fonts");
  const font = k => { const f = fs.readdirSync(fontsDir).find(x => x.startsWith(k + "-") && x.endsWith(".woff2")); if (!f) throw new Error("test4: font " + k + " missing"); return R + "fonts/" + f; };
  const LATIN = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
  const LATINX = "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF";
  const face = (fam, style, w, file, range) => `@font-face{font-family:'${fam}';font-style:${style};font-weight:${w};font-display:swap;src:url(${file}) format('woff2');unicode-range:${range}}`;
  const faces = [
    face("Bodoni Moda", "normal", "400 600", font("bodoni-normal-latin"), LATIN),
    face("Bodoni Moda", "normal", "400 600", font("bodoni-normal-latin-ext"), LATINX),
    face("Bodoni Moda", "italic", "400 600", font("bodoni-italic-latin"), LATIN),
    face("Bodoni Moda", "italic", "400 600", font("bodoni-italic-latin-ext"), LATINX),
    face("Frank Ruhl Libre", "normal", "400 500", font("frank-normal-hebrew"), "U+0307-0308, U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F"),
    face("Jost", "normal", "300 600", font("jost-normal-latin"), LATIN),
    face("Jost", "normal", "300 600", font("jost-normal-latin-ext"), LATINX),
    face("Jost", "normal", "300 600", font("jost-normal-cyrillic"), "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116"),
    face("Assistant", "normal", "200 800", font("assistant-normal-hebrew"), "U+0307-0308, U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F"),
    face("Urbanist", "normal", "500", font("urbanist-normal-all"), "U+41, U+49, U+4c, U+53, U+55-56, U+61, U+69, U+6c, U+73, U+75-76")
  ].join("\n");
  const dir = path.join(root, "src", "t4");
  const read = f => fs.readFileSync(path.join(dir, f), "utf8");

  /* 1 · the opening: the film, full bleed, closes into an arch as the page
     moves, and the line of the house is set either side of it */
  const open = `<section id="top" class="open" data-tone="film" aria-label="SILAVU">
  <div class="opin"><div class="ostick">
    <div class="ofilm">
      <picture><source media="(min-aspect-ratio: 14/5) and (min-width: 1800px)" srcset="${R}img/hero-lumiere-uw-2560.jpg 2560w, ${R}img/hero-lumiere-uw-3840.jpg 3840w" sizes="100vw"><source media="(max-width:899px)" srcset="${R}img/hero-lumiere-v-1080.jpg 1080w, ${R}img/hero-lumiere-v-1216.jpg 1216w" sizes="100vw"><img class="opost" src="${R}img/hero-lumiere-1920.jpg" srcset="${R}img/hero-lumiere-1920.jpg 1920w, ${R}img/hero-lumiere-2560.jpg 2560w, ${R}img/hero-lumiere-3840.jpg 3840w" sizes="100vw" alt="The SILAVU SOUL pendant on a woman's skin, above the neckline of a black silk dress, its pavé diamonds catching the light" data-alt-he="תליון SILAVU SOUL על עורה של אישה, מעל מחשוף שמלת משי שחורה, יהלומי הפאווה שלו תופסים את האור" fetchpriority="high"></picture>
      <video class="ovid" muted playsinline loop preload="none" aria-hidden="true" data-src="${R}v/hero-lumiere.mp4" data-src-4k="${R}v/hero-lumiere-4k.mp4" data-src-m="${R}v/hero-lumiere-v.mp4" data-src-uw="${R}v/hero-lumiere-uw.mp4"></video>
      <div class="oshade" aria-hidden="true"></div>
    </div>
    <p class="okick">${markUse("okm")}<span ${E("Fine jewellery · Finished by hand", "תכשיטי יוקרה · גימור בעבודת יד")}>Fine jewellery · Finished by hand</span></p>
    <h1 class="otitle"><span class="ol ol1" ${E("The Line of", "The Line of")}>The Line of</span><span class="ol ol2"><em ${E("Desire", "Desire")}>Desire</em></span></h1>
    <p class="olead" ${E("Crafted with intention. Made to leave an impression.", "נוצר מתוך כוונה. נעשה כדי להשאיר רושם.")}>Crafted with intention. Made to leave an impression.</p>
    <p class="ocap" ${E("LUMIÈRE · SOUL, worn", "שרשרת SOUL, ענודה")}>LUMIÈRE · SOUL, worn</p>
    <div class="ocue" aria-hidden="true"><span ${E("Scroll", "גללו")}>Scroll</span><i></i></div>
  </div></div>
</section>`;

  /* 2 · the house in one sentence, inked in word by word as it is read */
  const word = `<section id="house" class="word" data-tone="paper" aria-label="The house" data-aria-he="הבית">
  <div class="wwrap">
    ${t("p", "k wk", "The house", "הבית")}
    <p class="wtext" ${E("Signed by SILAVU and set by hand, each piece is made to become the one you never take off.", "חתומים בידי SILAVU ומשובצים ביד, כל תכשיט נועד להפוך לזה שלא תורידו לעולם.")}>Signed by SILAVU and set by hand, each piece is made to become the one you never take off.</p>
    <div class="wsign" aria-hidden="true">${markUse("wmk")}</div>
  </div>
</section>`;

  /* 3 · SOUL, in light: the piece pinned in white while the scroll plays its
     film (soul-frames.sh), the specs drawn onto the parts they name */
  const N = 120;
  const beat = inner => `<div class="sfbeat">${inner}</div>`;
  const call = (x, y, len, en, he) => `<div class="sfc" data-x="${x}" data-y="${y}" style="--len:${len}px"><i></i><b></b><span ${E(en, he)}>${en}</span></div>`;
  if (CX.split(",").length !== N) return null;
  const film = `<section id="soulfilm" class="sfilm" data-tone="paper" data-n="${N}" data-base="${R}f/soul/" data-cx="${CX}" data-cxref="0.494" data-stages="0,0.24,0.42,0.78" data-call="0.47,0.7" aria-label="SOUL, in light" data-aria-he="SOUL, באור">
  <div class="sfpin"><div class="sfstick">
    <img class="sfposter" src="${R}f/soul/d-000.webp" alt="" decoding="async" loading="lazy">
    <canvas role="img" aria-label="The SILAVU SOUL necklace floating in white light: it turns towards you, its pavé diamonds lift out of their settings and settle back, and it comes to rest on white silk" data-aria-he="שרשרת SILAVU SOUL מרחפת באור לבן: היא מסתובבת אליכם, יהלומי הפאווה שלה מתרוממים מהמושבים וחוזרים אליהם, והיא נחה על משי לבן"></canvas>
    <div class="sfcall" aria-hidden="true">
      ${call(0.575, 0.455, 120, "Pavé, set by hand", "פאווה, משובץ ביד")}
      ${call(0.643, 0.53, 70, metal.en, metal.he)}
    </div>
    <div class="sfbeats">
      ${beat(`${t("p", "k", "SILAVU SOUL", "SILAVU SOUL")}${t("h2", "h2", "The mark, <em>in light.</em>", "החותם, <em>באור.</em>")}${t("p", "p", "A fine 18K white-gold chain, and at its centre the SILAVU signature, drawn in pavé diamonds.", "שרשרת עדינה מזהב לבן 18K, ובמרכזה חתימת SILAVU, משורטטת ביהלומי פאווה.")}`)}
      ${beat(`${t("p", "k", "Set by hand", "משובץ ביד")}${t("h2", "h2", "Every stone, <em>chosen by eye.</em>", "כל אבן <em>נבחרת בעין.</em>")}${t("p", "p", "Each diamond of the signature is set in its own seat, one after another, by hand.", "כל יהלום בחתימה מונח במושב משלו, אחד אחרי השני, ביד.")}`)}
      ${beat(`${t("p", "k", "Inside the mark", "בתוך החותם")}${t("h2", "h2", "Pavé, <em>stone by stone.</em>", "פאווה, <em>אבן אחר אבן.</em>")}<dl class="specs"><dt ${E("Metal", "מתכת")}>Metal</dt><dd ${E(metal.en, metal.he)}>${metal.en}</dd><dt ${E("Setting", "שיבוץ")}>Setting</dt><dd ${E(setting.en, setting.he)}>${setting.en}</dd><dt ${E("Diamonds", "יהלומים")}>Diamonds</dt><dd ${E(chain[1].en, chain[1].he)}>${chain[1].en}</dd><dt ${E("Length", "אורך")}>Length</dt><dd ${E(length.en, length.he)}>${length.en}</dd></dl>`)}
      ${beat(`${t("p", "k", ref.en, ref.he)}${t("h2", "h2", "Made to be <em>lived in.</em>", "נולדה <em>להיענד.</em>")}${t("p", "p", "Made to order, in 18K white gold.", "מיוצרת לפי הזמנה, בזהב לבן 18K.")}<div class="acts"><a class="btn solid" href="${R}pieces/pave/"><span ${E("View SOUL", "לצפייה ב־SOUL")}>View SOUL</span></a><a class="btn" href="#appointment"><span ${E("Book a private viewing", "קביעת פגישה פרטית")}>Book a private viewing</span></a></div>`)}
    </div>
    <div class="prog" aria-hidden="true"><i></i></div>
  </div></div>
</section>`;

  /* 4 · the cut: a round brilliant drawn live, first as its 57 facets, then
     in light; its parts named while it is seen from the side */
  const cad = P("cadence");
  const part = (k, en, he, l) => `<div class="cpart${l ? " l" : ""}" data-part="${k}"><span ${E(en, he)}>${en}</span><b></b><i></i></div>`;
  const cut = `<section id="cut" class="cut" data-tone="night" aria-label="The round brilliant" data-aria-he="הבריליאנט העגול">
  <div class="cpin"><div class="cstick">
    <div class="cglow" aria-hidden="true"></div>
    <canvas class="ccv" role="img" aria-label="A round brilliant diamond, drawn live: first the outline of its 57 facets, then in light, turning to face you" data-aria-he="יהלום בחיתוך בריליאנט עגול, מצויר בזמן אמת: תחילה קווי המתאר של 57 הפאסטים שלו, ואחר כך באור, כשהוא מסתובב אליכם"></canvas>
    <div class="cparts" aria-hidden="true">
      ${part("table", "Table", "שולחן")}${part("crown", "Crown", "כתר")}${part("girdle", "Girdle", "חגורה", 1)}${part("pavilion", "Pavilion", "ביתן")}${part("culet", "Culet", "קולט", 1)}
    </div>
    <div class="cbeats">
      ${beat(`${t("p", "k", "The cut", "החיתוך")}${t("h2", "h2", "The round <em>brilliant.</em>", "הבריליאנט <em>העגול.</em>")}${t("p", "p", "Fifty-seven facets, each at its own angle, so that the light that enters the stone comes back to the eye.", "חמישים ושבעה פאסטים, כל אחד בזווית משלו, כך שהאור שנכנס לאבן חוזר אל העין.")}`)}
      ${beat(`${t("p", "k", "Drawn facet by facet", "משורטט פאסט אחר פאסט")}${t("h2", "h2", "Table, crown, <em>pavilion.</em>", "שולחן, כתר, <em>ביתן.</em>")}<dl class="specs"><dt ${E("Table", "שולחן")}>Table</dt><dd dir="ltr">54%</dd><dt ${E("Crown", "כתר")}>Crown</dt><dd dir="ltr">34.5°</dd><dt ${E("Pavilion", "ביתן")}>Pavilion</dt><dd dir="ltr">40.75°</dd><dt ${E("Facets", "פאסטים")}>Facets</dt><dd dir="ltr">57</dd></dl>${t("p", "p", "The proportions of an ideal cut.", "הפרופורציות של חיתוך אידיאלי.")}`)}
      ${beat(`${t("p", "k", "Brilliance · Fire · Scintillation", "ברק · אש · נצנוץ")}${t("h2", "h2", "White light, <em>broken into colour.</em>", "אור לבן, <em>נשבר לצבעים.</em>")}${t("p", "p", "Brilliance is the white light a diamond returns, fire the colours it splits that light into, scintillation the flashes as it moves.", "ברק הוא האור הלבן שהיהלום מחזיר, אש היא הצבעים שהוא מפרק אליהם את האור, ונצנוץ הוא ההבזקים כשהוא זז.")}`)}
      ${beat(`${t("p", "k", "In SILAVU", "ב־SILAVU")}${t("h2", "h2", "Set by hand, <em>stone by stone.</em>", "משובצים ביד, <em>אבן אחר אבן.</em>")}${t("p", "p", "Round brilliants and baguettes in CADENCE. Pavé diamonds tracing the signature of SOUL, ICON and AURA.", "בריליאנטים עגולים ובגטים ב־CADENCE. יהלומי פאווה המשרטטים את החתימה של SOUL, ICON ו־AURA.")}${cad ? `<div class="acts"><a class="btn light" href="${R}pieces/cadence/"><span ${E("View CADENCE", "לצפייה ב־CADENCE")}>View CADENCE</span></a></div>` : ""}`)}
    </div>
    ${t("p", "cnote", "Drawn live in your browser, ray by ray: 57 facets, refractive index 2.42.", "מצויר בזמן אמת בדפדפן שלכם, קרן אחר קרן: 57 פאסטים, מקדם שבירה 2.42.")}
    <div class="prog" aria-hidden="true"><i></i></div>
  </div></div>
</section>`;

  /* 5 · the signature, four pieces, brought forward one at a time */
  const FOUR = [["knot", "knot-flat"], ["ring", "ring-front"], ["pave", "necklace-detail"], ["aura", "aura-pair"]].map(([id, img]) => ({ p: P(id), img })).filter(x => x.p);
  const four = FOUR.length === 4 ? `<section id="four" data-tone="paper" aria-label="The signature, four pieces" data-aria-he="החתימה, ארבעה תכשיטים">
  <div class="fpin"><div class="fstick">
    <div class="fhead">${t("p", "k", "The signature", "החתימה")}${t("h2", "h2", "Four pieces, <em>one mark.</em>", "ארבעה תכשיטים, <em>חותם אחד.</em>")}</div>
    <div class="ftrack">${FOUR.map(({ p, img }) => `<div class="fpc"><a href="${R}pieces/${p.id}/" tabindex="-1" aria-hidden="true"><img src="${R}img/${img}-1254.jpg" srcset="${R}img/${img}-900.jpg 900w, ${R}img/${img}-1254.jpg 1254w" sizes="(min-width:900px) 34vw, 72vw" alt="" loading="lazy" decoding="async"></a></div>`).join("")}</div>
    <div class="finfo">${FOUR.map(({ p }) => `<div class="fone"><p class="fname" ${E(p.name.en, p.name.he)}>${p.name.en}</p><p class="fmeta">${p.meta.slice(0, 3).map(m => `<span ${E(m.en, m.he)}>${m.en}</span>`).join(" · ")}</p><a class="lnk" href="${R}pieces/${p.id}/"><span ${E("View the piece", "לצפייה בתכשיט")}>View the piece</span></a></div>`).join("")}</div>
    <div class="fnum" aria-hidden="true"><b>01</b> / 04</div>
  </div></div>
</section>` : "";

  /* 6 · what every piece is made of, carried across by the scroll */
  const words = [["18K white gold", "זהב לבן 18K"], ["Pavé", "פאווה"], ["Finished by hand", "גימור בעבודת יד"], ["Made to order", "לפי הזמנה"], ["Dubai", "דובאי"], ["Tel Aviv", "תל אביב"]];
  const run = words.map(([en, he]) => `<span ${E(en, he)}>${en}</span>${markUse("bmk")}`).join("");
  const band = `<section class="band" data-tone="paper" aria-hidden="true"><div class="brow"><div class="bline">${run}${run}</div></div><div class="brow r"><div class="bline">${run}${run}</div></div></section>`;

  /* 7 · the special pieces: colour and the cut; a second photograph on hover */
  const SP = [["promise", "promise-front", "promise-macro"], ["blush", "blush-front", "blush-worn"], ["cadence", "cadence-front", "cadence-worn"]].map(([id, a, b]) => ({ p: P(id), a, b })).filter(x => x.p);
  const img = (n, cls, alt) => `<img class="${cls}" src="${R}img/${n}-900.jpg" srcset="${R}img/${n}-640.jpg 640w, ${R}img/${n}-900.jpg 900w, ${R}img/${n}-1254.jpg 1254w" sizes="(min-width:900px) 30vw, 88vw" width="1254" height="1254" loading="lazy" decoding="async" ${alt ? `alt="${q(alt.en)}" data-alt-he="${q(alt.he)}"` : 'alt=""'}>`;
  const shotAlt = (p, n) => ((p.shots || []).find(s => s.img === n) || {}).alt;
  const special = SP.length ? `<section id="pieces" class="pcs" data-tone="paper" aria-labelledby="pcsh">
  <div class="phead">${t("p", "k", "Special pieces", "פריטים מיוחדים")}${t("h2", "h2", "Colour, <em>and the cut.</em>", "צבע, <em>והחיתוך.</em>", ' id="pcsh"')}</div>
  <div class="pgrid">${SP.map(({ p, a, b }, i) => `<article class="pc" style="--i:${i}">
    <a class="pfig" href="${R}pieces/${p.id}/">${img(a, "pa", shotAlt(p, a))}${img(b, "pb", null)}</a>
    <div class="pbody">${t("p", "k", p.kind.en, p.kind.he)}<h3 class="pname"><a href="${R}pieces/${p.id}/" ${E(p.name.en, p.name.he)}>${p.name.en}</a></h3><p class="pmeta">${p.meta.slice(0, 3).map(m => `<span ${E(m.en, m.he)}>${m.en}</span>`).join(" · ")}</p></div>
  </article>`).join("")}</div>
  <a class="lnk pall" href="${R}#collection"><span ${E("The whole collection", "כל הקולקציה")}>The whole collection</span></a>
</section>` : "";

  /* 8 · by appointment: the mark drawn as the page arrives, and the way in */
  const appt = `<section id="appointment" class="appt" data-tone="night" aria-labelledby="apph">
  <div class="amark" aria-hidden="true">${mark("amk", "b")}</div>
  <div class="abody">
    ${t("p", "k", "Dubai · Tel Aviv", "דובאי · תל אביב")}
    ${t("h2", "h2", "By <em>appointment.</em>", "<em>בתיאום</em> מראש.", ' id="apph"')}
    ${t("p", "p", "Every SILAVU piece can be seen in private. Tell the house what you are looking for, and a viewing will be arranged for you.", "כל תכשיט של SILAVU ניתן לראות באופן פרטי. ספרו לבית מה אתם מחפשים, ונתאם עבורכם פגישת צפייה.")}
    <div class="acts"><a class="btn light solid" href="${R}#concierge"><span ${E("Book a private viewing", "קביעת פגישה פרטית")}>Book a private viewing</span></a><a class="btn light mail" href="mailto:concierge@silavu.com" dir="ltr">concierge@silavu.com</a></div>
  </div>
</section>`;

  const LANGS = [["en", "EN"], ["he", "עב"], ["fr", "FR"], ["ar", "AR"], ["ru", "RU"]];
  const header = `<a class="skip" href="#house" ${E("Skip to content", "דלגו לתוכן")}>Skip to content</a>
<header class="hd" id="hd">
  <a class="brand" href="#top" aria-label="SILAVU">${markUse("hmk")}${logo("hlg")}</a>
  <nav class="nav" aria-label="Chapters" data-aria-he="פרקים">${t("a", "", "The cut", "החיתוך", ' href="#cut"')}${t("a", "", "The pieces", "התכשיטים", ' href="#four"')}${t("a", "", "By appointment", "בתיאום מראש", ' href="#appointment"')}</nav>
  <div class="lang" role="group" aria-label="Language" data-aria-he="שפה">${LANGS.map(([c, l]) => `<button type="button" data-lang="${c}" lang="${c}" aria-pressed="${c === "en"}">${l}</button>`).join("")}</div>
</header>`;
  const footer = `<footer class="ft" data-tone="night">
  <p class="ftword" aria-hidden="true">${logo("flg")}</p>
  <div class="ftrow">
    <nav aria-label="The house" data-aria-he="הבית">${t("a", "", "The whole collection", "כל הקולקציה", ` href="${R}#collection"`)}${t("a", "", "About", "אודות", ` href="${R}about/"`)}${FOOTER_DOCS.slice(0, 4).map(d => t("a", "", d.title.en, d.title.he, ` href="${R}${d.slug}/"`)).join("")}</nav>
    <p class="k" ${E("Dubai · Tel Aviv · By appointment", "דובאי · תל אביב · בתיאום מראש")}>Dubai · Tel Aviv · By appointment</p>
    <p class="k"><span dir="ltr">© SILAVU <span class="fyr">${new Date().getFullYear()}</span></span> · <a href="#top" ${E("Back to the top", "חזרה למעלה")}>Back to the top</a></p>
  </div>
</footer>`;

  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>SILAVU · The Line of Desire</title>
<meta name="description" content="SILAVU fine jewellery: the SOUL necklace in light, the round brilliant, the signature and the special pieces. Dubai · Tel Aviv · By appointment.">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#fbfaf8">
<meta name="color-scheme" content="light">
<link rel="icon" href="${R}favicon.ico?v=6" sizes="48x48 32x32 16x16">
<link rel="icon" href="${R}favicon.svg" type="image/svg+xml">
<link rel="preload" as="font" type="font/woff2" href="${font("bodoni-normal-latin")}" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="${font("bodoni-italic-latin")}" crossorigin>
<link rel="preload" as="image" fetchpriority="high" media="(min-width: 900px)" href="${R}img/hero-lumiere-1920.jpg" imagesrcset="${R}img/hero-lumiere-1920.jpg 1920w, ${R}img/hero-lumiere-2560.jpg 2560w, ${R}img/hero-lumiere-3840.jpg 3840w" imagesizes="100vw">
<link rel="preload" as="image" fetchpriority="high" media="(max-width: 899px)" href="${R}img/hero-lumiere-v-1080.jpg" imagesrcset="${R}img/hero-lumiere-v-1080.jpg 1080w, ${R}img/hero-lumiere-v-1216.jpg 1216w" imagesizes="100vw">
<style>
${faces}
${read("t4.css")}
</style>
</head>
<body>
${markDefs()}
${header}
<main>
${open}
${word}
${film}
${cut}
${four}
${band}
${special}
${appt}
</main>
${footer}
<script>
${read("gem.js")}
${read("t4.js")}
</script>
</body>
</html>
`;
}
