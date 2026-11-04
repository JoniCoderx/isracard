/* /about13/: "Behind SILAVU", redesigned for /test13/ (the house's note of
   3 Nov 2026: "it needs to be WOW"). Only the house's own words (src/about.mjs)
   and its own photographs: Ariel Silas's portrait, ICON's pavé close, and the
   three signature pieces. One idea per screen: the founder over Dubai at
   night; the vision said once, large and quiet, its words coming up one by
   one; the making, beside the pavé; the three collections joined by the
   knot; the way in. Dark, calm, Jost; the same chrome as /test13/. */
import fs from "node:fs";
import path from "node:path";

export function about13Page({ ABOUT, PIECES, markDefs, markUse, root, v14 = false }) {
  /* v14: the same page in /test14/'s black, with the founder full height, the facts in a line, the worn pieces and the way in with the mark */
  const a = ABOUT, R = "../", HOME = v14 ? "test14/" : "test13/", COLL = v14 ? "collection14/" : "test13/#collection";
  const fontsDir = path.join(root, "public/fonts");
  const ff = re => fs.readdirSync(fontsDir).find(x => re.test(x));
  const jost = ff(/^jost-normal-latin-[0-9a-f]{6}\.woff2$/), jostx = ff(/^jost-normal-latin-ext-[0-9a-f]{6}\.woff2$/), urb = ff(/^urbanist-normal-all-[0-9a-f]{6}\.woff2$/);
  if (!jost || !jostx || !urb || !a || !a.portrait) return null;
  const P = id => PIECES.find(p => p.id === id);
  const three = [["knot", "MOMENT"], ["ring", "ICON"], ["pave", "SOUL"]].map(([id, w]) => ({ p: P(id), w })).filter(x => x.p);
  if (three.length !== 3) return null;
  const q = v => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const plain = s => String(s).replace(/<[^>]+>/g, "");
  const L = a.letter.map(x => x.en);
  /* the vision, said once: the sentence after the colon in the house's second paragraph */
  let vision = (L[1].split(": ")[1] || L[1]).split(". ")[0].replace(/\.$/, "") + ".";
  vision = vision.charAt(0).toUpperCase() + vision.slice(1);
  const visionWords = vision.split(" ").map((w, i) => `<span style="--i:${i}">${q(w)}</span>`).join(" ");
  const css = fs.readFileSync(path.join(root, "src", "t13", "about13.css"), "utf8") + (v14 ? "\n" + fs.readFileSync(path.join(root, "src", "t14", "about14.css"), "utf8") : "");

  const WORN = { knot: "knot-worn", ring: "ring-worn", pave: "necklace-worn" };
  const card = ({ p, w }) => `<a class="col" href="${R}pieces/${p.id}/">
      <span class="colpic">${v14 ? `<img src="${R}img/${WORN[p.id]}-1254.jpg" srcset="${R}img/${WORN[p.id]}-900.jpg 900w, ${R}img/${WORN[p.id]}-1254.jpg 1254w"` : `<img src="${R}studio6/${p.id}-a-700.webp" srcset="${R}studio6/${p.id}-a-700.webp 700w, ${R}studio6/${p.id}-a-1200.webp 1200w"`} sizes="(max-width: 760px) 80vw, 30vw" width="1200" height="1200" alt="${q(plain(p.name.en))}" loading="lazy" decoding="async"></span>
      <span class="colk">${q(p.kind.en)}</span><span class="coln">SILAVU <b>${w}</b></span></a>`;

  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${q(a.seo.en)}</title>
<meta name="description" content="${q(a.desc.en)}">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#050505">
<link rel="icon" href="${R}favicon.svg" type="image/svg+xml">
<link rel="preload" as="image" href="${R}${a.portrait}-1100.jpg" fetchpriority="high">
<link rel="preload" as="font" type="font/woff2" crossorigin href="${R}fonts/${jost}">
<script>document.documentElement.classList.add("js")</script>
<style>@font-face{font-family:'Jost';font-style:normal;font-weight:300 600;font-display:swap;src:url(${R}fonts/${jost}) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Jost';font-style:normal;font-weight:300 600;font-display:swap;src:url(${R}fonts/${jostx}) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Silavu Name';font-style:normal;font-weight:500;font-display:swap;src:url(${R}fonts/${urb}) format('woff2');unicode-range:U+41,U+49,U+4c,U+53,U+55-56,U+61,U+69,U+6c,U+73,U+75-76}
${css}</style>
</head>
<body>
${markDefs()}
${v14 ? `<header class="bar bar14">
  <nav class="tnav" aria-label="Main"><a href="${R}${COLL}">Collection</a><a href="${R}${HOME}#build">Design yours</a><a href="${R}about14/" aria-current="page">About</a></nav>
  <a class="hback" href="${R}${HOME}" aria-label="Back to the house"><i aria-hidden="true"></i></a>
  <a class="back" href="${R}${HOME}" aria-label="SILAVU, the house">${markUse("")}<span class="wm">SILAVU</span></a>
  <a class="pill" href="${R}${HOME}#concierge">Book a private viewing</a>
</header>` : `<header class="bar">
  <a class="back" href="${R}${HOME}">${markUse("")}<span class="wm">SILAVU</span></a>
  <a class="pill" href="${R}${HOME}#concierge">Book a private viewing</a>
</header>`}
<main>
  <section class="open" aria-labelledby="ah">
    <figure class="por"><img src="${R}${a.portrait}-1100.jpg" srcset="${R}${a.portrait}-800.jpg 800w, ${R}${a.portrait}-1100.jpg 1100w" sizes="(max-width: 860px) 100vw, 50vw" width="1100" height="1375" alt="${q(a.name.en)}, ${q(a.role.en)} of SILAVU, in Dubai at night"><figcaption><b>${q(a.name.en)}</b><span>${q(a.role.en)}</span></figcaption></figure>
    <div class="otxt">
      <p class="k">${q(a.eyebrow.en)}</p>
      <h1 id="ah">Behind <em>SILAVU</em></h1>
      <p class="lead">${L[0]}</p>
    </div>
    <div class="scroll" aria-hidden="true"><i></i></div>
  </section>

  <section class="vision" aria-label="The vision">
    ${markUse("vmk")}
    <p class="vk k">The vision</p>
    <p class="vline">${visionWords}</p>
    <p class="vrest">${q(L[1].split(". ").slice(1).join(". "))}</p>
  </section>

  ${v14 ? `<section class="facts" aria-label="SILAVU in brief"><ul>
    <li><b>Ariel Silas</b><span>Founder and designer</span></li>
    <li><b>3D</b><span>A background in 3D and visual design</span></li>
    <li><b>Jacob &amp; Co.</b><span>Creative collaborations</span></li>
    <li><b>Dubai</b><span>Made by hand by skilled craftsmen</span></li>
    <li><b>By appointment</b><span>Seen in private in Dubai and Tel Aviv</span></li>
  </ul></section>` : ""}
  <section class="make" aria-labelledby="mh">
    <figure class="mpic"><img src="${R}img/ring-macro-1254.jpg" srcset="${R}img/ring-macro-900.jpg 900w, ${R}img/ring-macro-1254.jpg 1254w" sizes="(max-width: 860px) 100vw, 46vw" width="1254" height="1254" loading="lazy" decoding="async" alt="The pavé signature of SILAVU ICON, close"></figure>
    <div class="mtxt">
      <p class="k">Made in Dubai</p>
      <h2 id="mh">By hand, <em>to the smallest detail.</em></h2>
      <p>${q(L[2])}</p>
    </div>
  </section>

  <section class="three" aria-labelledby="th">
    <p class="k">One signature</p>
    <h2 id="th">${q(L[3])}</h2>
    <div class="cols">${three.map(card).join("")}</div>
  </section>

  <section class="end">
    ${markUse("emk")}
    ${v14 ? `<p class="endk k">Where next</p>
    <div class="ways">
      <a class="way" href="${R}${COLL}"><img src="${R}img/ring-worn-900.jpg" alt="" loading="lazy" decoding="async"><span class="wk">The collection</span><b>Discover the pieces</b></a>
      <a class="way" href="${R}${HOME}#build"><img src="${R}models/bracelet-900.jpg" alt="" loading="lazy" decoding="async"><span class="wk">Bespoke</span><b>Design your bracelet</b></a>
      <a class="way" href="${R}${HOME}#concierge"><img src="${R}models/necklace-900.jpg" alt="" loading="lazy" decoding="async"><span class="wk">By appointment</span><b>${q(a.cta2.en)}</b></a>
    </div>` : `<div class="acts"><a class="btn" href="${R}${HOME}#collection">${q(a.cta1.en)}</a><a class="lnk" href="${R}${HOME}#concierge">${q(a.cta2.en)}</a></div>`}
  </section>
</main>
${v14 ? `<footer class="foot foot14"><div class="fin"><a class="fmk" href="${R}${HOME}" aria-label="SILAVU">${markUse("")}<span class="wm">SILAVU</span></a>
  <nav aria-label="Explore"><a href="${R}${COLL}">Collection</a><a href="${R}${HOME}#build">Design yours</a><a href="${R}${HOME}#inside">The box</a><a href="${R}${HOME}#concierge">Enquire</a></nav>
  <span class="fc">© SILAVU 2026 · Dubai · Tel Aviv · By appointment</span></div></footer>` : `<footer class="foot"><span>© SILAVU 2026 · Dubai · Tel Aviv · By appointment</span><a href="${R}${HOME}">Back to the house</a></footer>`}
<script>${fs.readFileSync(path.join(root, "src", "t13", "about13.js"), "utf8")}</script>
</body>
</html>
`;
}
