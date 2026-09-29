/* The house monogram, pavé-set, on a station chain — drawn from the official
   symbol path rather than described to an image model, so the geometry is the
   geometry. Stones are placed along every contour of the mark (outer ribbon
   and inner holes alike), inset along the inward normal the way a setter
   works, and the inward side is decided by asking the path itself.
   Writes the plates the catalogue asks for into site/media/clover/. */
import { chromium } from "playwright-core";
import { MARK_B, MARK_BW } from "../site/src/body.mjs";
import fs from "fs";
import path from "path";

const OUT = path.resolve("../lumera/site/media/clover");
const SIZE = 1254;
const VB = Math.ceil(MARK_BW);          /* 874 × 1000 */

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 2 });

/* ── 1. where the stones go ───────────────────────────────────────────────── */
await p.setContent(`<svg id="s" viewBox="0 0 ${VB} 1000"><path id="m" d="${MARK_B}"/></svg>`);
const pave = await p.evaluate(({ step, inset }) => {
  const m = document.getElementById("m"), L = m.getTotalLength(), out = [];
  const at = t => { const q = m.getPointAtLength(Math.max(0, Math.min(L, t))); return { x: q.x, y: q.y }; };
  const svg = document.getElementById("s");
  const pt = svg.createSVGPoint();
  const inside = (x, y) => { pt.x = x; pt.y = y; return m.isPointInFill(pt); };
  for (let t = 0; t < L; t += step) {
    const a = at(t - 2), c = at(t + 2), q = at(t);
    let dx = c.x - a.x, dy = c.y - a.y;
    const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
    /* the two normals; keep the one that points into the metal */
    let nx = -dy, ny = dx;
    if (!inside(q.x + nx * inset, q.y + ny * inset)) { nx = -nx; ny = -ny; }
    if (!inside(q.x + nx * inset, q.y + ny * inset)) continue;   /* band too thin here */
    out.push([+(q.x + nx * inset).toFixed(2), +(q.y + ny * inset).toFixed(2)]);
  }
  return out;
}, { step: 38, inset: 21 });
console.log("stones placed:", pave.length);

/* ── 2. the plate ─────────────────────────────────────────────────────────── */
const W = 1000;                                   /* plate is drawn square at 1000 */
const PEN_H = 232;                                /* the mark's height on the plate */
const scale = PEN_H / 1000;
const penW = VB * scale, penX = (W - penW) / 2, penY = 520;
const stone = r => `<g><circle r="${r}" fill="url(#g-st)"/><circle r="${r}" fill="none" stroke="#6f727b" stroke-width="${(r * .13).toFixed(2)}" opacity=".85"/><circle r="${(r * .5).toFixed(2)}" cx="${(-r * .16).toFixed(2)}" cy="${(-r * .2).toFixed(2)}" fill="#ffffff" opacity=".92"/><circle r="${(r * .17).toFixed(2)}" cx="${(r * .28).toFixed(2)}" cy="${(r * .3).toFixed(2)}" fill="#7d818c" opacity=".55"/></g>`;

/* a fine cable chain running from the top corners down to the pendant */
function chain() {
  const links = [];
  const L = { x: 108, y: 132 }, R = { x: W - 108, y: 132 };
  const C = { x: W / 2, y: penY + 6 };
  const bez = (t, A, B) => {                       /* quadratic, control pulled down */
    const K = { x: (A.x + B.x) / 2, y: B.y + (A.x < B.x ? 96 : 96) };
    const u = 1 - t;
    return { x: u * u * A.x + 2 * u * t * K.x + t * t * B.x,
             y: u * u * A.y + 2 * u * t * K.y + t * t * B.y };
  };
  for (const A of [L, R]) {
    const N = 96;
    for (let i = 0; i <= N; i++) {
      const t = i / N, q = bez(t, A, C), n = bez(Math.min(1, t + .01), A, C);
      const ang = Math.atan2(n.y - q.y, n.x - q.x) * 180 / Math.PI;
      const flip = i % 2 ? 90 : 0;
      links.push(`<ellipse cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" rx="5.2" ry="3.1" transform="rotate(${(ang + flip).toFixed(1)} ${q.x.toFixed(1)} ${q.y.toFixed(1)})" fill="none" stroke="url(#g-ch)" stroke-width="1.7"/>`);
      /* four bezel-set stations, two a side */
      if (i === 24 || i === 54) {
        links.push(`<g transform="translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})"><circle r="8.6" fill="url(#g-mt)" stroke="#83868f" stroke-width="1"/>${stone(5.4)}</g>`);
      }
    }
  }
  return links.join("");
}

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="${W}" height="${W}">
 <defs>
  <linearGradient id="g-mt" x1="0" y1="0" x2="0" y2="1">
   <stop offset="0" stop-color="#fdfdfe"/><stop offset=".2" stop-color="#d6d8de"/>
   <stop offset=".46" stop-color="#8f939c"/><stop offset=".62" stop-color="#b6b9c1"/>
   <stop offset=".82" stop-color="#e7e8ec"/><stop offset="1" stop-color="#9ea1aa"/></linearGradient>
  <linearGradient id="g-ch" x1="0" y1="0" x2="0" y2="1">
   <stop offset="0" stop-color="#eceef2"/><stop offset=".45" stop-color="#8b8e97"/>
   <stop offset="1" stop-color="#c3c5cc"/></linearGradient>
  <radialGradient id="g-st" cx=".36" cy=".3" r=".78">
   <stop offset="0" stop-color="#ffffff"/><stop offset=".3" stop-color="#eef1f8"/>
   <stop offset=".66" stop-color="#bcc2ce"/><stop offset="1" stop-color="#868b98"/></radialGradient>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
   <feGaussianBlur stdDeviation="9"/></filter>
 </defs>
 <rect width="${W}" height="${W}" fill="#f7f7f5"/>
 <ellipse cx="${W / 2}" cy="${penY + PEN_H + 34}" rx="150" ry="19" fill="#0d0d10" opacity=".13" filter="url(#soft)"/>
 ${chain()}
 <g transform="translate(${penX} ${penY}) scale(${scale})">
   <path d="${MARK_B}" fill="url(#g-mt)" stroke="#70747d" stroke-width="4"/>
   <g>${pave.map(([x, y]) => `<g transform="translate(${x} ${y})">${stone(12.5)}</g>`).join("")}</g>
 </g>
</svg>`;

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "clover-flat.svg"), svg);
await p.setContent(`<style>html,body{margin:0;background:#f7f7f5}</style>${svg.replace('width="1000" height="1000"', `width="${SIZE}" height="${SIZE}"`)}`);
await p.waitForTimeout(250);
await p.screenshot({ path: path.join(OUT, "clover-flat.png"), clip: { x: 0, y: 0, width: SIZE, height: SIZE } });
console.log("wrote", path.join(OUT, "clover-flat.png"));
await b.close();
