/* /test11/: SILAVU as a dark room (taste-skill direction "The dark room",
   seed 1659095065, 2 Nov 2026). One dark field from top to bottom, and in
   it the pieces, lit: the LUMIÈRE film under the name; SOUL, ICON and
   MOMENT each in a screen of their own, turning in black, with a card that
   moves one column to the right each time; the pieces worn, gathered round
   a heading; the line bracelet in three stages down a diagonal, the last of
   which the reader sets (a cut and a metal: the house's own photograph of
   that bracelet); the house, its knot as the frame of a photograph; the
   booking card on the viewing table's leather; the name again at the foot.
   Gambarino for the voice, General Sans for the words, the name in the
   wordmark's own face (Urbanist). Styles in t11.css, behaviour in t11.js. */
import fs from "node:fs";
import path from "node:path";

export function test11Page({ PIECES, markDefs, root, MARK_B, MARK_BW }) {
  const R = "../";
  const q = v => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const plain = s => String(s).replace(/<[^>]+>/g, "");
  const P = id => PIECES.find(p => p.id === id);
  const spec = (p, label) => { const r = (p.specs || []).find(x => x[0].en === label); return r ? r[1].en : ""; };
  const need = ["pave", "ring", "knot", "aura", "blush", "cadence", "promise"].map(P);
  if (need.some(x => !x)) return null;
  const fontsDir = path.join(root, "public/fonts");
  const ff = re => fs.readdirSync(fontsDir).find(x => re.test(x));
  const urb = ff(/^urbanist-normal-all-[0-9a-f]{6}\.woff2$/), gam = ff(/^gambarino-400-[0-9a-f]{6}\.woff2$/), gs4 = ff(/^generalsans-400-[0-9a-f]{6}\.woff2$/), gs5 = ff(/^generalsans-500-[0-9a-f]{6}\.woff2$/);
  if (!urb || !gam || !gs4 || !gs5) return null;
  const read = f => fs.readFileSync(path.join(root, "src", "t11", f), "utf8");
  const name = p => plain(p.name.en).replace(/^SILAVU\s+/, "");
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  /* the knot, as a mask for the photograph of the house */
  const knotMask = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${Math.ceil(MARK_BW)} 1000'><path d='${MARK_B}' fill='black'/></svg>`)}")`;

  const nav = `<nav class="nav" aria-label="Main">
    <a href="#pieces">The pieces</a><a href="#line">Your line</a><a href="#house">The house</a><a href="#visit">Book a viewing</a>
  </nav>
  <details class="pmenu"><summary>Menu</summary><nav aria-label="Main, on a phone"><a href="#pieces">The pieces</a><a href="#line">Your line</a><a href="#house">The house</a><a href="#visit">Book a viewing</a></nav></details>`;

  const hero = `<header class="hero" id="top">
  <div class="hpic">
    <picture><source media="(max-aspect-ratio: 1/1)" srcset="${R}img/hero-lumiere-v-1080.jpg 1080w, ${R}img/hero-lumiere-v-1216.jpg 1216w" sizes="100vw">
      <img class="hpost" src="${R}img/hero-lumiere-1920.jpg" srcset="${R}img/hero-lumiere-1600.jpg 1600w, ${R}img/hero-lumiere-1920.jpg 1920w, ${R}img/hero-lumiere-2560.jpg 2560w" sizes="100vw" width="1920" height="1080" fetchpriority="high" alt="The SILAVU SOUL pendant on a woman's skin, above the neckline of a black silk dress, its pavé diamonds catching the light"></picture>
    <video class="hvid" muted playsinline loop autoplay preload="none" data-src="${R}v/hero-lumiere.mp4" data-src-m="${R}v/hero-lumiere-v.mp4" poster="${R}img/hero-lumiere-1920.jpg" aria-hidden="true"></video>
    ${nav}
  </div>
  <div class="hband">
    <div class="hrow">
      <p class="hsub">Fine jewellery in 18K gold and diamonds, signed with one knot. Seen in private, in Dubai and Tel Aviv.</p>
      <a class="btn" href="#visit">Book a private viewing</a>
    </div>
    <h1 class="name" aria-label="SILAVU, fine jewellery"><span aria-hidden="true">SILAVU</span></h1>
  </div>
</header>`;

  /* the pieces, each in its own film: the card moves a column each time */
  const FILMS = [["pave", "soul"], ["ring", "icon"], ["knot", "moment"]];
  const frame = ([id, f], i) => {
    const p = P(id), first = i === 0, tag = first ? "h2" : "h3";
    const fact = spec(p, "Setting") ? `${spec(p, "Setting")} diamonds` : spec(p, "Finish");
    const size = spec(p, "Length") || spec(p, "Size");
    return `<article class="frame c${i + 2}" id="f-${f}" aria-labelledby="fn-${f}">
    <div class="fvid"><img src="${R}img/${f}-film-poster.jpg" width="1080" height="1080" alt="${q(p.film && p.film.alt ? p.film.alt.en : "The " + plain(p.name.en) + " turning in black")}" loading="${first ? "eager" : "lazy"}" decoding="async"><video muted playsinline loop preload="none" poster="${R}img/${f}-film-poster.jpg" data-src="${R}v/${f}-film.mp4" data-src-m="${R}v/${f}-film-720.mp4" aria-hidden="true"></video></div>
    <div class="card">
      <${tag} class="cname" id="fn-${f}">${first ? "SILAVU SOUL" : "SILAVU " + name(p)}</${tag}>
      <p class="cvar">${q(p.kind.en)} in ${q(spec(p, "Metal").replace(/^18K/, "18K"))}</p>
      <p class="cfact">${q(fact)}${size ? " · " + q(size) : ""}</p>
      <div class="cpic"><img src="${R}studio6/${id}-a-700.webp" width="700" height="700" alt="The ${q(plain(p.name.en))}, whole, on white" loading="lazy" decoding="async"></div>
      <a class="btn dark" href="${R}pieces/${id}/">View the ${q(p.kind.en.toLowerCase())}</a>
    </div>
  </article>`;
  };
  const pieces = `<section class="pieces" id="pieces" aria-label="The pieces">
  ${FILMS.map(frame).join("\n  ")}
</section>`;

  /* the pieces worn, gathered round a heading (the page's one rest) */
  const WORN = [["aura-worn", "aura", "The AURA earrings, worn"], ["necklace-worn", "pave", "The SOUL necklace, worn"], ["blush-worn", "blush", "The BLUSH eternity ring, worn"], ["ring-worn", "ring", "The ICON ring, worn"],
    ["knot-worn", "knot", "The MOMENT bracelet, worn three together"], ["cadence-worn", "cadence", "The CADENCE bracelet, worn"], ["models/bracelet", "knot", "A woman wearing the SILAVU MOMENT bracelet, her hand on her shoulder"]];
  const worn = `<section class="worn" id="worn" aria-labelledby="wh">
  <div class="whead">
    <h2 id="wh">Worn every day, not kept.</h2>
    <p>Each piece is signed with the SILAVU knot and set by hand, to be worn with everything.</p>
    <a class="lnk" href="${R}#collection">See the whole collection</a>
  </div>
  ${WORN.map(([img, id, alt], i) => `<a class="wp w${i + 1}" href="${R}pieces/${id}/" data-rate="${[6, 10, 4, 12, 8, 5, 9][i]}">${img.startsWith("models/") ? `<img src="${R}${img}-900.jpg" sizes="200px" width="900" height="1125"` : `<img src="${R}img/${img}-640.jpg" srcset="${R}img/${img}-640.jpg 640w, ${R}img/${img}-900.jpg 900w" sizes="200px" width="640" height="711"`} alt="${q(alt)}" loading="lazy" decoding="async"></a>`).join("\n  ")}
</section>`;

  /* the line bracelet, by hand, in three stages; the third is the reader's */
  const CUTS = ["round", "oval", "cushion", "princess", "emerald", "marquise", "pear", "baguette"];
  const METALS = [["white", "White gold"], ["yellow", "Yellow gold"], ["rose", "Rose gold"], ["platinum", "Platinum"]];
  const line = `<section class="line" id="line" aria-labelledby="lh">
  <h2 id="lh">Your line, by hand.</h2>
  <figure class="st s1"><img src="${R}img/tennis-1600.jpg" width="1600" height="1986" alt="A SILAVU line bracelet of round diamonds on black" loading="lazy" decoding="async"></figure>
  <p class="sp p1"><b>First, the stones.</b> Eight cuts, natural or lab-grown. Each diamond is matched to the one beside it by eye, so the line reads as one light.</p>
  <figure class="st s2"><img src="${R}img/promise-macro-900.jpg" srcset="${R}img/promise-macro-900.jpg 900w, ${R}img/promise-macro-1254.jpg 1254w" sizes="(max-width: 760px) 62vw, 22vw" width="900" height="900" alt="18K yellow gold, polished by hand, holding a baguette diamond" loading="lazy" decoding="async"></figure>
  <p class="sp p2"><b>Then, the gold.</b> Set by hand in 18K white, yellow or rose gold, or in platinum, and made to the size of your wrist.</p>
  <figure class="st s3" id="linepic"><img src="${R}line/round-white-1600.jpg" width="1600" height="1195" alt="The SILAVU line bracelet in round diamonds and white gold" loading="lazy" decoding="async"></figure>
  <div class="sp p3">
    <p><b>Last, yours.</b> Choose the cut and the metal, and see the line as it will be made. It arrives in the SILAVU box, with a GIA or IGI certificate.</p>
    <fieldset class="pick" id="pcut"><legend>Cut</legend>${CUTS.map((c, i) => `<button type="button" data-cut="${c}" aria-pressed="${i === 0}">${cap(c)}</button>`).join("")}</fieldset>
    <fieldset class="pick" id="pmetal"><legend>Metal</legend>${METALS.map(([m, l], i) => `<button type="button" data-metal="${m}" aria-pressed="${i === 0}">${l}</button>`).join("")}</fieldset>
    <a class="lnk" id="lineGo" href="${R}#build">Design it in full, with your wrist size</a>
  </div>
</section>`;

  /* the house: its knot frames her */
  const house = `<section class="house" id="house" aria-labelledby="hh">
  <div class="panel">
    <h2 id="hh">One knot, in every piece.</h2>
    <div class="knotpic" style="--knot:${q(knotMask)}"><img src="${R}img/hero-lumiere-1600.jpg" srcset="${R}img/hero-lumiere-1600.jpg 1600w, ${R}img/hero-lumiere-1920.jpg 1920w" sizes="(max-width: 760px) 120vw, 60vw" width="1920" height="1080" alt="The SOUL pendant on skin, seen through the shape of the SILAVU knot it is made of" loading="lazy" decoding="async"></div>
    <div class="htexts">
      <div><h3>Two loops, two open arcs</h3><p>The SILAVU knot is one line that never ends. On the SOUL pendant it is traced in 163 diamonds, and it runs through every piece the house makes.</p></div>
      <div><h3>By appointment</h3><p>The house shows its pieces in private, in Dubai and in Tel Aviv. A piece can also travel to you, insured, with care and resizing for life.</p></div>
      <a class="btn" href="#visit">Book a private viewing</a>
    </div>
  </div>
</section>`;

  /* the visit: one card on the viewing table */
  const visit = `<section class="visit" id="visit" aria-labelledby="vh">
  <div class="vpic"><img class="vleather" src="${R}desk/leather-2560.jpg" srcset="${R}desk/leather-1600.jpg 1600w, ${R}desk/leather-2560.jpg 2560w" sizes="100vw" width="2560" height="1440" alt="" loading="lazy" decoding="async"><img class="vline" src="${R}line/emerald-white-1600.jpg" width="1600" height="1195" alt="A SILAVU line bracelet of emerald-cut diamonds lying on black leather" loading="lazy" decoding="async"></div>
  <div class="vcard">
    <h2 id="vh">A private viewing</h2>
    <p>Dubai and Tel Aviv, by appointment. Or at your home, anywhere.</p>
    <dl class="clocks"><div><dt>Dubai</dt><dd data-tz="Asia/Dubai">&nbsp;</dd></div><div><dt>Tel Aviv</dt><dd data-tz="Asia/Jerusalem">&nbsp;</dd></div></dl>
    <p><a class="lnk" href="mailto:concierge@silavu.com?subject=A%20private%20viewing">concierge@silavu.com</a></p>
    <a class="btn wide" href="${R}#enquire">Book a private viewing</a>
  </div>
</section>`;

  const foot = `<footer class="foot">
  <div class="fcols">
    <div><p class="fh">The house</p><a href="${R}about/">About SILAVU</a><a href="${R}authenticity/">Authenticity</a><a href="${R}care/">Jewellery care</a></div>
    <div><p class="fh">The pieces</p><a href="${R}pieces/pave/">SOUL</a><a href="${R}pieces/ring/">ICON</a><a href="${R}pieces/knot/">MOMENT</a><a href="${R}#collection">All pieces</a></div>
    <div><p class="fh">Visit</p><p>Dubai, by appointment</p><p>Tel Aviv, by appointment</p></div>
    <div><p class="fh">Write</p><a href="mailto:concierge@silavu.com">concierge@silavu.com</a><a href="${R}#enquire">Book a private viewing</a></div>
  </div>
  <p class="fname" aria-hidden="true">SILAVU</p>
  <p class="legal">© SILAVU 2026 · <a href="${R}privacy/">Privacy</a> · <a href="${R}terms/">Terms</a> · <a href="${R}accessibility/">Accessibility</a></p>
</footer>`;

  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>SILAVU · Fine jewellery</title>
<meta name="description" content="SILAVU fine jewellery: 18K gold and diamonds, signed with one knot, set by hand. Seen in private in Dubai and Tel Aviv.">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#0b0b0c">
<link rel="icon" href="${R}favicon.svg" type="image/svg+xml">
<link rel="preload" as="font" type="font/woff2" crossorigin href="${R}fonts/${gs4}">
<link rel="preload" as="image" fetchpriority="high" media="(min-aspect-ratio: 1/1)" href="${R}img/hero-lumiere-1920.jpg">
<script>document.documentElement.classList.add("js")</script>
<style>@font-face{font-family:'Silavu Name';font-style:normal;font-weight:500;font-display:swap;src:url(${R}fonts/${urb}) format('woff2');unicode-range:U+41,U+49,U+4c,U+53,U+55-56,U+61,U+69,U+6c,U+73,U+75-76}
@font-face{font-family:'Gambarino';font-style:normal;font-weight:400;font-display:swap;src:url(${R}fonts/${gam}) format('woff2')}
@font-face{font-family:'General Sans';font-style:normal;font-weight:400;font-display:swap;src:url(${R}fonts/${gs4}) format('woff2')}
@font-face{font-family:'General Sans';font-style:normal;font-weight:500;font-display:swap;src:url(${R}fonts/${gs5}) format('woff2')}
${read("t11.css")}</style>
</head>
<body>
<a class="skip" href="#pieces">Skip to the pieces</a>
${markDefs()}
${hero}
<main>
${pieces}
${worn}
${line}
${house}
${visit}
</main>
${foot}
<script>${read("t11.js")}</script>
</body>
</html>
`;
}
