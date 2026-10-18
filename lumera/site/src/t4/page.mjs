/* /test4/ (owner, 18 Oct 2026: "build it from zero, crazy, charming,
   amazing, so people say: what is this, I'm in love"). A page of its own,
   not the home page rearranged: its own type (Bodoni Moda, Frank Ruhl Libre
   for Hebrew), its own chapters, and only the house's real material: the
   LUMIÈRE film, the SOUL frames, the piece photographs, the exact mark, and
   the pieces' own words and specs (src/pieces.mjs). The one thing drawn
   rather than photographed is the round brilliant in "The cut": a diagram
   of the cut, rendered once from src/t4/gem.js (cut-frames.mjs) and played
   by the scroll; the page says it is drawn.
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

  const TALL = "(max-aspect-ratio: 1/1)";
  const pieceName = p => p.name.en.replace(/<[^>]+>/g, "");
  const LIST = PIECES.filter(p => p.id && !p.exceptional);
  const refOf = p => { const r = spec(p, "Reference"); return r ? r.en : p.ref || ""; };

  /* 1 · the opening. The first screen already says what the house is and
     offers the two ways in; as the page moves the film closes into an arch,
     and the line of the house is set either side of it */
  const open = `<section id="top" class="open" data-tone="film" aria-labelledby="oh1">
  <div class="opin"><div class="ostick">
    <div class="ofilm">
      <picture><source media="(min-aspect-ratio: 14/5) and (min-width: 1800px)" srcset="${R}img/hero-lumiere-uw-2560.jpg 2560w, ${R}img/hero-lumiere-uw-3840.jpg 3840w" sizes="100vw"><source media="${TALL}" srcset="${R}img/hero-lumiere-v-1080.jpg 1080w, ${R}img/hero-lumiere-v-1216.jpg 1216w" sizes="100vw"><img class="opost" src="${R}img/hero-lumiere-1920.jpg" srcset="${R}img/hero-lumiere-1920.jpg 1920w, ${R}img/hero-lumiere-2560.jpg 2560w, ${R}img/hero-lumiere-3840.jpg 3840w" sizes="100vw" alt="The SILAVU SOUL pendant on a woman's skin, above the neckline of a black silk dress, its pavé diamonds catching the light" data-alt-he="תליון SILAVU SOUL על עורה של אישה, מעל מחשוף שמלת משי שחורה, יהלומי הפאווה שלו תופסים את האור" fetchpriority="high"></picture>
      <video class="ovid" muted playsinline loop preload="none" aria-hidden="true" data-src="${R}v/hero-lumiere.mp4" data-src-m="${R}v/hero-lumiere-v.mp4" data-src-uw="${R}v/hero-lumiere-uw.mp4"></video>
      <div class="oshade" aria-hidden="true"></div>
    </div>
    <div class="ohero">
      ${t("p", "k", "Fine jewellery · Finished by hand", "תכשיטי יוקרה · גימור בעבודת יד")}
      <h1 class="oh1" id="oh1"><span ${E("The Line of", "The Line of")}>The Line of</span> <em ${E("Desire", "Desire")}>Desire</em></h1>
      <div class="acts"><a class="btn light solid" href="#four"><span ${E("Discover the collection", "לגלות את הקולקציה")}>Discover the collection</span></a><button class="btn light" type="button" data-book><span ${E("Book a private viewing", "קביעת פגישה פרטית")}>Book a private viewing</span></button></div>
    </div>
    <p class="otitle" aria-hidden="true"><span class="ol ol1">The Line of</span><span class="ol ol2"><em>Desire</em></span></p>
    <p class="olead" ${E("Crafted with intention. Made to leave an impression.", "נוצר מתוך כוונה. נעשה כדי להשאיר רושם.")}>Crafted with intention. Made to leave an impression.</p>
  </div></div>
</section>`;

  /* 2 · the house in one sentence, inked in word by word as it is read */
  const word = `<section id="house" class="word" data-tone="paper" aria-label="The house" data-aria-he="הבית">
  <div class="wwrap">
    ${t("p", "k wk", "The house", "הבית")}
    <p class="wtext" ${E("Signed by SILAVU and set by hand, each piece is made to become the one you never take off.", "חתומים בידי SILAVU ומשובצים ביד, כל תכשיט נועד להפוך לזה שלא תורידו לעולם.")}>Signed by SILAVU and set by hand, each piece is made to become the one you never take off.</p>
  </div>
</section>`;

  /* 3 · SOUL, in light: the signature moment. The piece pinned in white
     while the scroll plays its film (soul-frames.sh): it turns to you, its
     pavé lifts out and settles, it comes to rest. Three stages, the specs
     drawn onto the parts they name while the stones are out */
  const N = 120;
  const beat = inner => `<div class="sfbeat">${inner}</div>`;
  const call = (x, y, len, en, he) => `<div class="sfc" data-x="${x}" data-y="${y}" style="--len:${len}px"><i></i><b></b><span ${E(en, he)}>${en}</span></div>`;
  if (CX.split(",").length !== N) return null;
  const film = `<section id="soulfilm" class="sfilm scene" data-tone="paper" data-n="${N}" data-base="${R}f/soul/" data-cx="${CX}" data-cxref="0.494" data-stages="0,0.32,0.72" data-call="0.36,0.68" aria-label="SOUL, in light" data-aria-he="SOUL, באור">
  <div class="spin"><div class="sstick">
    <img class="sposter" src="${R}f/soul/d-000.webp" alt="" decoding="async" loading="lazy" data-tall="${R}f/soul/m-000.webp">
    <canvas class="scv" role="img" aria-label="The SILAVU SOUL necklace floating in white light: it turns towards you, its pavé diamonds lift out of their settings and settle back, and it comes to rest on white silk" data-aria-he="שרשרת SILAVU SOUL מרחפת באור לבן: היא מסתובבת אליכם, יהלומי הפאווה שלה מתרוממים מהמושבים וחוזרים אליהם, והיא נחה על משי לבן"></canvas>
    <div class="sfcall" aria-hidden="true">
      ${call(0.575, 0.455, 120, "Pavé, set by hand", "פאווה, משובץ ביד")}
      ${call(0.643, 0.53, 70, metal.en, metal.he)}
    </div>
    <div class="beats">
      ${beat(`${t("p", "k", "SILAVU SOUL", "SILAVU SOUL")}${t("h2", "h2", "The mark, <em>in light.</em>", "החותם, <em>באור.</em>")}${t("p", "p", "A fine 18K white-gold chain, and at its centre the SILAVU signature, drawn in pavé diamonds.", "שרשרת עדינה מזהב לבן 18K, ובמרכזה חתימת SILAVU, משורטטת ביהלומי פאווה.")}`)}
      ${beat(`${t("p", "k", "Inside the mark", "בתוך החותם")}${t("h2", "h2", "Pavé, <em>stone by stone.</em>", "פאווה, <em>אבן אחר אבן.</em>")}<dl class="specs"><dt ${E("Metal", "מתכת")}>Metal</dt><dd ${E(metal.en, metal.he)}>${metal.en}</dd><dt ${E("Setting", "שיבוץ")}>Setting</dt><dd ${E(setting.en, setting.he)}>${setting.en}</dd><dt ${E("Diamonds", "יהלומים")}>Diamonds</dt><dd ${E(chain[1].en, chain[1].he)}>${chain[1].en}</dd><dt ${E("Length", "אורך")}>Length</dt><dd ${E(length.en, length.he)}>${length.en}</dd></dl>`)}
      ${beat(`${t("p", "k", ref.en, ref.he)}${t("h2", "h2", "Made to be <em>lived in.</em>", "נולדה <em>להיענד.</em>")}${t("p", "p", "Made to order, in 18K white gold.", "מיוצרת לפי הזמנה, בזהב לבן 18K.")}<div class="acts"><a class="btn solid" href="${R}pieces/pave/"><span ${E("View SOUL", "לצפייה ב־SOUL")}>View SOUL</span></a><button class="btn" type="button" data-book="pave"><span ${E("Book a private viewing", "קביעת פגישה פרטית")}>Book a private viewing</span></button></div>`)}
    </div>
    <div class="prog" aria-hidden="true"><i></i></div>
  </div></div>
</section>`;

  /* 4 · ICON, from one stone: the diamond moment. The ring built in a warm
     studio, rendered once (icon-frames.mjs, icon-scene.js) and played by
     the scroll: one round brilliant above the plinth breaks into the pavé,
     the pavé draws the SILAVU signature, the white gold forms under it, the
     band is drawn round; then the ring as it is worn (its own photograph) */
  const icon = P("ring");
  const iconRef = icon && spec(icon, "Reference");
  const wornAlt = icon && ((icon.shots || []).find(x => x.img === "ring-worn") || {}).alt;
  const ICON = icon && iconRef && wornAlt ? `<section id="icon" class="icon scene" data-tone="stone" data-n="120" data-base="${R}f/icon/" data-stages="0,0.2,0.45,0.72" aria-label="SILAVU ICON, from one stone" data-aria-he="SILAVU ICON, מאבן אחת">
  <div class="spin"><div class="sstick">
    <img class="iposter" src="${R}f/icon/d-119.webp" alt="" decoding="async" loading="lazy" data-tall="${R}f/icon/m-119.webp">
    <canvas class="icv" role="img" aria-label="The SILAVU ICON ring being made: one round diamond floats above a stone plinth, breaks into small diamonds that draw the SILAVU signature, the white gold forms beneath them, and the band is drawn round until the ring stands finished" data-aria-he="טבעת SILAVU ICON נוצרת: יהלום עגול אחד מרחף מעל במה מאבן, מתפרק ליהלומים קטנים שמשרטטים את חתימת SILAVU, הזהב הלבן נוצר מתחתם, והחישוק נמשך סביב עד שהטבעת עומדת שלמה"></canvas>
    <img class="iworn" src="${R}img/ring-worn-1254.jpg" srcset="${R}img/ring-worn-900.jpg 900w, ${R}img/ring-worn-1254.jpg 1254w" sizes="100vw" alt="${q(wornAlt.en)}" data-alt-he="${q(wornAlt.he)}" loading="lazy" decoding="async">
    <div class="beats">
      ${beat(`${t("p", "k", "SILAVU ICON", "SILAVU ICON")}${t("h2", "h2", "It begins with <em>one stone.</em>", "זה מתחיל <em>באבן אחת.</em>")}${t("p", "p", "A round brilliant: fifty-seven facets, each at its own angle, so that the light that enters the stone comes back to the eye.", "בריליאנט עגול: חמישים ושבעה פאסטים, כל אחד בזווית משלו, כך שהאור שנכנס לאבן חוזר אל העין.")}`)}
      ${beat(`${t("p", "k", "The signature", "החתימה")}${t("h2", "h2", "Drawn in <em>pavé.</em>", "משורטטת <em>בפאווה.</em>")}${t("p", "p", "Pavé diamonds follow the two strands of the SILAVU mark, smaller where the strands narrow.", "יהלומי פאווה עוקבים אחרי שני הגדילים של סמל SILAVU, וקטנים יותר היכן שהגדילים צרים.")}`)}
      ${beat(`${t("p", "k", "18K white gold", "זהב לבן 18K")}${t("h2", "h2", "The mark, <em>in white gold.</em>", "החותם, <em>בזהב לבן.</em>")}${t("p", "p", "The crescents are left polished, so the stones and the metal each catch the light in their own way.", "הסהרונים נשארים מלוטשים, כך שהאבנים והמתכת תופסות כל אחת את האור בדרכה.")}`)}
      ${beat(`${t("p", "k", iconRef.en, iconRef.he)}${t("h2", "h2", "ICON, <em>worn.</em>", "ICON, <em>ענודה.</em>")}${t("p", "p", icon.line.en, icon.line.he)}<div class="acts"><a class="btn light solid" href="${R}pieces/ring/"><span ${E("View ICON", "לצפייה ב־ICON")}>View ICON</span></a><button class="btn light" type="button" data-book="ring"><span ${E("Book a viewing", "תיאום צפייה")}>Book a viewing</span></button></div>`)}
    </div>
    <div class="prog" aria-hidden="true"><i></i></div>
  </div></div>
</section>` : "";

  /* 5 · the collection: the four signature pieces in one studio, each in
     two of its own photographed angles (four-studio.py). Each card holds its
     picture, name, particulars and links together, so the same markup is the
     pinned stage on a wide screen, a swiped gallery on a phone, and a grid
     with reduced motion */
  const FOUR = [["knot", "knot-flat", "knot-full"], ["ring", "ring-front", "ring-side"], ["pave", "necklace-detail", "necklace-front"], ["aura", "aura-pair", "aura-signed"]].map(([id, a, b]) => ({ p: P(id), a, b })).filter(x => x.p);
  const simg = (n, cls, alt) => `<img class="${cls}" src="${R}studio/${n}-700.webp" srcset="${R}studio/${n}-700.webp 700w, ${R}studio/${n}-1100.webp 1100w" sizes="(max-aspect-ratio: 1/1) 78vw, 40vw" width="1100" height="1100" decoding="async" loading="lazy" ${alt ? `alt="${q(alt.en)}" data-alt-he="${q(alt.he)}"` : 'alt=""'}>`;
  const four = FOUR.length === 4 ? `<section id="four" class="four" data-tone="studio" aria-roledescription="carousel" aria-labelledby="fourh">
  <div class="fpin"><div class="fstick">
    <div class="fhead">${t("p", "k", "The signature", "החתימה")}${t("h2", "h2", "Four pieces, <em>one mark.</em>", "ארבעה תכשיטים, <em>חותם אחד.</em>", ' id="fourh"')}</div>
    <div class="ftrack" tabindex="-1">${FOUR.map(({ p, a, b }, i) => `<article class="fcard" id="f-${p.id}" data-i="${i}" aria-roledescription="slide" aria-label="${i + 1} / 4">
      <a class="fimg" href="${R}pieces/${p.id}/" tabindex="-1" aria-hidden="true"><i class="fsh"></i>${simg(a, "fa", null)}${simg(b, "fb", null)}</a>
      <div class="finfo">${t("p", "k", p.kind.en, p.kind.he)}<h3 class="fname"><a href="${R}pieces/${p.id}/" ${E(p.name.en, p.name.he)}>${p.name.en}</a></h3><p class="fmeta">${p.meta.slice(0, 3).map(m => `<span ${E(m.en, m.he)}>${m.en}</span>`).join(" · ")}</p><p class="facts"><a class="lnk" href="${R}pieces/${p.id}/"><span ${E("View the piece", "לצפייה בתכשיט")}>View the piece</span></a><button class="lnk" type="button" data-book="${p.id}"><span ${E("Book a viewing", "תיאום צפייה")}>Book a viewing</span></button></p></div>
    </article>`).join("")}</div>
    <div class="fnav">
      <button class="fstep fprev" type="button" aria-label="Previous piece" data-aria-he="התכשיט הקודם"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
      <div class="fdots">${FOUR.map(({ p }, i) => `<button class="fdot" type="button" data-i="${i}" aria-label="${q(pieceName(p))}"${i ? "" : ' aria-current="true"'}><span>${q(pieceName(p).replace(/^SILAVU\s+/, ""))}</span></button>`).join("")}</div>
      <button class="fstep fnext" type="button" aria-label="Next piece" data-aria-he="התכשיט הבא"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
      <p class="fnum" aria-live="polite"><b>01</b> / 04</p>
    </div>
  </div></div>
</section>` : "";

  /* 6 · the special pieces: colour and the cut; a second photograph on hover */
  const SP = [["promise", "promise-front", "promise-macro"], ["blush", "blush-front", "blush-worn"], ["cadence", "cadence-front", "cadence-worn"]].map(([id, a, b]) => ({ p: P(id), a, b })).filter(x => x.p);
  const img = (n, cls, alt) => `<img class="${cls}" src="${R}img/${n}-900.jpg" srcset="${R}img/${n}-640.jpg 640w, ${R}img/${n}-900.jpg 900w, ${R}img/${n}-1254.jpg 1254w" sizes="(min-width:900px) 30vw, 88vw" width="1254" height="1254" loading="lazy" decoding="async" ${alt ? `alt="${q(alt.en)}" data-alt-he="${q(alt.he)}"` : 'alt=""'}>`;
  const shotAlt = (p, n) => ((p.shots || []).find(s => s.img === n) || {}).alt;
  const special = SP.length ? `<section id="pieces" class="pcs" data-tone="paper" aria-labelledby="pcsh">
  <div class="phead">${t("p", "k", "Special pieces", "פריטים מיוחדים")}${t("h2", "h2", "Colour, <em>and the cut.</em>", "צבע, <em>והחיתוך.</em>", ' id="pcsh"')}</div>
  <div class="pgrid">${SP.map(({ p, a, b }, i) => `<article class="pc" style="--i:${i}">
    <a class="pfig" href="${R}pieces/${p.id}/" tabindex="-1" aria-hidden="true">${img(a, "pa", shotAlt(p, a))}${img(b, "pb", null)}</a>
    <div class="pbody">${t("p", "k", p.kind.en, p.kind.he)}<h3 class="pname"><a href="${R}pieces/${p.id}/" ${E(p.name.en, p.name.he)}>${p.name.en}</a></h3><p class="pmeta">${p.meta.slice(0, 3).map(m => `<span ${E(m.en, m.he)}>${m.en}</span>`).join(" · ")}</p><p class="facts"><a class="lnk" href="${R}pieces/${p.id}/"><span ${E("View the piece", "לצפייה בתכשיט")}>View the piece</span></a><button class="lnk" type="button" data-book="${p.id}"><span ${E("Book a viewing", "תיאום צפייה")}>Book a viewing</span></button></p></div>
  </article>`).join("")}</div>
  <a class="lnk pall" href="${R}#collection"><span ${E("The whole collection", "כל הקולקציה")}>The whole collection</span></a>
</section>` : "";

  /* 7 · by appointment */
  const appt = `<section id="appointment" class="appt" data-tone="night" aria-labelledby="apph">
  <div class="amark" aria-hidden="true">${mark("amk", "b")}</div>
  <div class="abody">
    ${t("p", "k", "Dubai · Tel Aviv", "דובאי · תל אביב")}
    ${t("h2", "h2", "By <em>appointment.</em>", "<em>בתיאום</em> מראש.", ' id="apph"')}
    ${t("p", "p", "Every SILAVU piece can be seen in private. Tell the house what you are looking for, and a viewing will be arranged for you.", "כל תכשיט של SILAVU ניתן לראות באופן פרטי. ספרו לבית מה אתם מחפשים, ונתאם עבורכם פגישת צפייה.")}
    <div class="acts"><button class="btn light solid" type="button" data-book><span ${E("Book a private viewing", "קביעת פגישה פרטית")}>Book a private viewing</span></button><a class="btn light mail" href="mailto:concierge@silavu.com" dir="ltr">concierge@silavu.com</a></div>
  </div>
</section>`;

  /* the private viewing: the piece and the reader's language travel with
     the reader to the house's own booking form (its address carries them,
     ?piece=…#concierge), or into an email to the concierge. Nothing is sent
     from here */
  const book = `<div class="sheet book" id="book" role="dialog" aria-modal="true" aria-labelledby="bookh" hidden>
  <div class="scrim" data-close></div>
  <div class="panel" tabindex="-1">
    <button class="close" type="button" data-close aria-label="Close" data-aria-he="סגירה"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    ${t("p", "k", "Dubai · Tel Aviv", "דובאי · תל אביב")}
    ${t("h2", "h2", "A private <em>viewing.</em>", "צפייה <em>פרטית.</em>", ' id="bookh"')}
    ${t("p", "p", "Choose the piece you would like to see. The house arranges every viewing in person, in Dubai or Tel Aviv.", "בחרו את התכשיט שתרצו לראות. הבית מתאם כל צפייה באופן אישי, בדובאי או בתל אביב.")}
    <fieldset class="bpieces"><legend class="k" ${E("The piece", "התכשיט")}>The piece</legend>
      ${LIST.map(p => `<label class="bp"><input type="radio" name="bpiece" id="bp-${p.id}" value="${p.id}" data-ref="${q(refOf(p))}" data-name="${q(pieceName(p))}"><span class="bpn" ${E(p.name.en, p.name.he)}>${p.name.en}</span><span class="bpr" dir="ltr">${q(refOf(p))}</span></label>`).join("")}
      <label class="bp"><input type="radio" name="bpiece" id="bp-open" value="" data-ref="" data-name=""><span class="bpn" ${E("Not decided yet", "עוד לא החלטתי")}>Not decided yet</span><span class="bpr"></span></label>
    </fieldset>
    <dl class="specs bsum"><dt ${E("Reference", "מק\"ט")}>Reference</dt><dd class="bref" dir="ltr">—</dd><dt ${E("Language", "שפה")}>Language</dt><dd class="blang">English</dd></dl>
    <div class="acts"><a class="btn solid bgo" href="${R}#concierge"><span ${E("Continue to the booking form", "המשך לטופס התיאום")}>Continue to the booking form</span></a><a class="btn bmail" href="mailto:concierge@silavu.com"><span ${E("Write to the concierge", "כתבו לקונסיירז׳")}>Write to the concierge</span></a></div>
    ${t("p", "bnote", "The booking form opens with this piece already chosen, in your language. Nothing is sent until you send it.", "טופס התיאום ייפתח כשהתכשיט כבר נבחר, בשפה שלכם. דבר לא נשלח עד שתשלחו.")}
  </div>
</div>`;

  const LANGS = [["en", "EN", "English"], ["he", "עב", "עברית"], ["fr", "FR", "Français"], ["ar", "AR", "العربية"], ["ru", "RU", "Русский"]];
  const langBtns = cls => `<div class="${cls}" role="group" aria-label="Language" data-aria-he="שפה">${LANGS.map(([c, l, full]) => `<button type="button" data-lang="${c}" lang="${c}" aria-pressed="${c === "en"}" aria-label="${full}">${cls === "mlang" ? full : l}</button>`).join("")}</div>`;
  const NAV = [["#four", "Collection", "קולקציה"], ["#soulfilm", "SOUL", "SOUL"], ["#icon", "ICON", "ICON"], ["#appointment", "Appointment", "תיאום פגישה"]];
  /* the bar: as on the product pages, the mark home, the chapters, the
     language and the appointment; on a phone, one menu */
  const header = `<a class="skip" href="#main" ${E("Skip to content", "דלגו לתוכן")}>Skip to content</a>
<header class="hd" id="hd">
  <a class="brand" href="#top" aria-label="SILAVU">${markUse("hmk")}${logo("hlg")}</a>
  <nav class="nav" aria-label="Chapters" data-aria-he="פרקים">${NAV.map(([h, en, he]) => t("a", "", en, he, ` href="${h}"`)).join("")}</nav>
  <div class="hact">${langBtns("lang")}<button class="hbook" type="button" data-book><span ${E("Private appointment", "פגישה פרטית")}>Private appointment</span></button><button class="hmenu" type="button" aria-expanded="false" aria-controls="menu" aria-label="Menu" data-aria-he="תפריט"><i></i><i></i></button></div>
</header>
<div class="sheet menu" id="menu" role="dialog" aria-modal="true" aria-label="Menu" data-aria-he="תפריט" hidden>
  <div class="scrim" data-close></div>
  <div class="panel" tabindex="-1">
    <button class="close" type="button" data-close aria-label="Close" data-aria-he="סגירה"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <nav class="mnav" aria-label="Chapters" data-aria-he="פרקים">${[...NAV.slice(0, 3), ["#pieces", "Special pieces", "פריטים מיוחדים"], NAV[3]].map(([h, en, he]) => t("a", "", en, he, ` href="${h}" data-close`)).join("")}</nav>
    <button class="btn solid" type="button" data-book><span ${E("Book a private viewing", "קביעת פגישה פרטית")}>Book a private viewing</span></button>
    ${langBtns("mlang")}
  </div>
</div>`;
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
<link rel="preload" as="image" fetchpriority="high" media="(min-aspect-ratio: 1/1)" href="${R}img/hero-lumiere-1920.jpg" imagesrcset="${R}img/hero-lumiere-1920.jpg 1920w, ${R}img/hero-lumiere-2560.jpg 2560w, ${R}img/hero-lumiere-3840.jpg 3840w" imagesizes="100vw">
<link rel="preload" as="image" fetchpriority="high" media="(max-aspect-ratio: 1/1)" href="${R}img/hero-lumiere-v-1080.jpg" imagesrcset="${R}img/hero-lumiere-v-1080.jpg 1080w, ${R}img/hero-lumiere-v-1216.jpg 1216w" imagesizes="100vw">
<script>/* the collection's layout is chosen before the page is laid out: a pinned stage on a wide screen, a gallery elsewhere */(function(){var h=document.documentElement,w=innerWidth,v=innerHeight;if(!matchMedia("(prefers-reduced-motion: reduce)").matches&&w>=900&&v>=560&&w/v>=1.05)h.classList.add("pin4");})();</script>
<style>
${faces}
${read("t4.css")}
</style>
</head>
<body>
${markDefs()}
${header}
<main id="main">
${open}
${word}
${film}
${ICON}
${four}
${special}
${appt}
</main>
${footer}
${book}
<script>
${read("t4.js")}
</script>
</body>
</html>
`;
}
