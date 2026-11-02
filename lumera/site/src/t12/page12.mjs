/* /test12/: SILAVU on white (the house's brief, 2 Nov 2026): one piece,
   SOUL, lying on the SILAVU box on one side of the first screen, and the
   house's mark, name and one sentence on the other (the picture is rendered
   in Blender: website/tools/soul-box.py). Then the collection, where the
   pointer is a jeweller's loupe over each piece; the pieces worn; the line
   bracelet built by the reader; the appointment. Jost for the words, as on
   /test3/, the name in the wordmark's own face. Styles in t12.css,
   behaviour in t12.js. */
import fs from "node:fs";
import path from "node:path";

export function test12Page({ PIECES, markDefs, markUse, root }) {
  const R = "../";
  const q = v => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const plain = s => String(s).replace(/<[^>]+>/g, "");
  const P = id => PIECES.find(p => p.id === id);
  const spec = (p, label) => { const r = (p.specs || []).find(x => x[0].en === label); return r ? r[1].en : ""; };
  const ORDER = ["pave", "ring", "knot", "aura", "promise", "blush", "cadence"];
  const LIST = ORDER.map(P);
  if (LIST.some(x => !x)) return null;
  const fontsDir = path.join(root, "public/fonts");
  const ff = re => fs.readdirSync(fontsDir).find(x => re.test(x));
  const jost = ff(/^jost-normal-latin-[0-9a-f]{6}\.woff2$/), jostx = ff(/^jost-normal-latin-ext-[0-9a-f]{6}\.woff2$/), urb = ff(/^urbanist-normal-all-[0-9a-f]{6}\.woff2$/);
  if (!jost || !jostx || !urb || !fs.existsSync(path.join(root, "public/hero12/soul-box-1500.webp"))) return null;
  const read = f => fs.readFileSync(path.join(root, "src", "t12", f), "utf8");
  const name = p => plain(p.name.en).replace(/^SILAVU\s+/, "");

  const header = `<header class="bar">
  <a class="brand" href="#top" aria-label="SILAVU, to the top">${markUse("")}<span class="wm">SILAVU</span></a>
  <nav class="links" aria-label="Main"><a href="#collection">Collection</a><a href="#builder">Build your bracelet</a><a href="#visit">The house</a></nav>
  <a class="btn small" href="#visit">Book a viewing</a>
</header>`;

  const hero = `<section class="hero" id="top" aria-labelledby="h1">
  <div class="hstage" aria-hidden="false">
    <img class="hobj" src="${R}hero12/soul-box-1500.webp" srcset="${R}hero12/soul-box-900.webp 900w, ${R}hero12/soul-box-1500.webp 1500w" sizes="(max-width: 860px) 100vw, 56vw" width="1500" height="1500" fetchpriority="high" decoding="async"
      alt="The SILAVU SOUL necklace lying on the black lacquered SILAVU box with its rose-gold band, its chain in a loose loop on the lid">
  </div>
  <div class="htext">
    <div class="hmark" aria-hidden="true">${markUse("")}</div>
    <h1 id="h1"><span class="wm big">SILAVU</span><span class="vh"> fine jewellery</span></h1>
    <p class="lead">Fine jewellery in 18K gold and diamonds, signed with one knot and set by hand. Seen in private, in Dubai and Tel Aviv.</p>
    <div class="acts"><a class="btn" href="#collection">Discover the collection</a><a class="lnk" href="#visit">Book a private viewing</a></div>
    <p class="caption">On the box: SILAVU SOUL, 18K white gold and pavé diamonds.</p>
  </div>
</section>`;

  /* the collection: the pointer is a loupe over each piece */
  const tile = (p, i) => `<li class="tile${i < 4 ? " sig" : ""}">
    <a class="tpic" href="${R}pieces/${p.id}/" data-zoom="${R}studio6/${p.id}-a-1200.webp" aria-label="${q(plain(p.name.en))}, ${q(p.kind.en)}">
      <img src="${R}studio6/${p.id}-a-700.webp" srcset="${R}studio6/${p.id}-a-700.webp 700w, ${R}studio6/${p.id}-a-1200.webp 1200w" sizes="(max-width: 860px) 50vw, 25vw" width="1200" height="1200" alt="" loading="lazy" decoding="async">
      <span class="loupe" aria-hidden="true"></span>
    </a>
    <div class="tcap"><p class="tname"><a href="${R}pieces/${p.id}/">SILAVU <b>${q(name(p))}</b></a></p><p class="tkind">${q(p.kind.en)} · ${q(spec(p, "Metal"))}</p></div>
  </li>`;
  const collection = `<section class="collection" id="collection" aria-labelledby="ch">
  <div class="shead"><h2 id="ch">The collection</h2><p>Seven pieces, each signed with the knot. Move over a piece to see it through the loupe.</p></div>
  <ul class="grid">${LIST.map(tile).join("")}</ul>
</section>`;

  /* worn */
  const WORN = [["ring", "ring", "A woman wearing the SILAVU ICON ring, her hand resting at her jaw"], ["necklace", "pave", "A woman wearing the SILAVU SOUL necklace, the pendant below her collarbones"], ["bracelet", "knot", "A woman wearing the SILAVU MOMENT bracelet, her hand on her shoulder"]];
  const worn = `<section class="worn" aria-labelledby="wh">
  <div class="shead"><h2 id="wh">Worn</h2><p>Made to be lived in, every day.</p></div>
  <div class="wrow">${WORN.map(([img, id, alt]) => `<a class="wpic" href="${R}pieces/${id}/"><img src="${R}models/${img}-900.jpg" srcset="${R}models/${img}-900.jpg 900w, ${R}models/${img}-1400.jpg 1400w" sizes="(max-width: 860px) 80vw, 33vw" width="1400" height="1750" alt="${q(alt)}" loading="lazy" decoding="async"><span>SILAVU ${q(name(P(id)))}</span></a>`).join("")}</div>
</section>`;

  /* build your bracelet */
  const CUTS = ["round", "oval", "cushion", "princess", "emerald", "marquise", "pear", "baguette"];
  const METALS = [["white", "White gold"], ["yellow", "Yellow gold"], ["rose", "Rose gold"], ["platinum", "Platinum"]];
  const CARATS = [3, 6, 9, 12], WRISTS = [15, 16, 17, 18, 19];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const seg = (id, label, items, on) => `<fieldset class="opt" id="${id}"><legend>${label}</legend><div class="chips">${items.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${v === on}">${l}</button>`).join("")}</div></fieldset>`;
  const builder = `<section class="builder" id="builder" aria-labelledby="bh">
  <div class="shead"><h2 id="bh">Build your bracelet</h2><p>A line of diamonds, made to your measure. Choose, and see it as it will be made.</p></div>
  <div class="bgrid">
    <figure class="tray"><img id="bimg" src="${R}line/round-white-1600.jpg" srcset="${R}line/round-white-1000.jpg 1000w, ${R}line/round-white-1600.jpg 1600w" sizes="(max-width: 860px) 100vw, 58vw" width="1600" height="1195" alt="The SILAVU line bracelet in round diamonds and white gold" loading="lazy" decoding="async"></figure>
    <div class="bctl">
      ${seg("o-cut", "Diamond cut", CUTS.map(c => [c, cap(c)]), "round")}
      ${seg("o-metal", "Metal", METALS, "white")}
      ${seg("o-ct", "Total carat weight", CARATS.map(c => [String(c), c + " ct"]), "6")}
      ${seg("o-wrist", "Wrist size", WRISTS.map(w => [String(w), w + " cm"]), "17")}
      <div class="sum"><p class="sline" id="bsum">Round diamonds · White gold · 6 ct · 17 cm</p><p class="sprice">Priced personally for the stones you choose. GIA or IGI certified, insured delivery.</p>
      <a class="btn wide" id="bgo" href="mailto:concierge@silavu.com?subject=My%20SILAVU%20line%20bracelet">Reserve this bracelet</a></div>
    </div>
  </div>
</section>`;

  const visit = `<section class="visit" id="visit" aria-labelledby="vh">
  <div class="vmark" aria-hidden="true">${markUse("")}</div>
  <h2 id="vh">A private viewing</h2>
  <p>The house shows its pieces in private, by appointment, in Dubai and in Tel Aviv, or at your home, anywhere.</p>
  <dl class="clocks"><div><dt>Dubai</dt><dd data-tz="Asia/Dubai">&nbsp;</dd></div><div><dt>Tel Aviv</dt><dd data-tz="Asia/Jerusalem">&nbsp;</dd></div></dl>
  <div class="acts center"><a class="btn" href="${R}#enquire">Book a private viewing</a><a class="lnk" href="mailto:concierge@silavu.com">concierge@silavu.com</a></div>
</section>`;

  const foot = `<footer class="foot">
  <a class="brand" href="#top">${markUse("")}<span class="wm">SILAVU</span></a>
  <nav aria-label="The house"><a href="${R}about/">About</a><a href="${R}authenticity/">Authenticity</a><a href="${R}care/">Care</a><a href="${R}privacy/">Privacy</a><a href="${R}terms/">Terms</a><a href="${R}accessibility/">Accessibility</a></nav>
  <p>© SILAVU 2026 · Dubai · Tel Aviv · By appointment</p>
</footer>`;

  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>SILAVU · Fine jewellery</title>
<meta name="description" content="SILAVU fine jewellery: 18K gold and diamonds, signed with one knot and set by hand. Seen in private in Dubai and Tel Aviv.">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="${R}favicon.svg" type="image/svg+xml">
<link rel="preload" as="image" fetchpriority="high" href="${R}hero12/soul-box-1500.webp" imagesrcset="${R}hero12/soul-box-900.webp 900w, ${R}hero12/soul-box-1500.webp 1500w" imagesizes="(max-width: 860px) 100vw, 56vw">
<link rel="preload" as="font" type="font/woff2" crossorigin href="${R}fonts/${jost}">
<script>document.documentElement.classList.add("js")</script>
<style>@font-face{font-family:'Jost';font-style:normal;font-weight:300 600;font-display:swap;src:url(${R}fonts/${jost}) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Jost';font-style:normal;font-weight:300 600;font-display:swap;src:url(${R}fonts/${jostx}) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Silavu Name';font-style:normal;font-weight:500;font-display:swap;src:url(${R}fonts/${urb}) format('woff2');unicode-range:U+41,U+49,U+4c,U+53,U+55-56,U+61,U+69,U+6c,U+73,U+75-76}
${read("t12.css")}</style>
</head>
<body>
<a class="skip" href="#collection">Skip to the collection</a>
${markDefs()}
${header}
<main>
${hero}
${collection}
${worn}
${builder}
${visit}
</main>
${foot}
<script>${read("t12.js")}</script>
</body>
</html>
`;
}
