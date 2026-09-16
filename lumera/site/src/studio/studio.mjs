// The studio: the exact SILAVU mark rendered as platinum jewellery, lit like a campaign still. Six frames, 4:5, four widths.
import fs from "node:fs";
import { MARK, MARK_W, LOGO } from "../body.mjs";
const S = new URL(".", import.meta.url).pathname;
const V = 2000, H = 2500; // frame in user units
const DEFS = `
<defs>
  <linearGradient id="plat" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fbfbfc"/><stop offset=".22" stop-color="#c6c9d0"/><stop offset=".42" stop-color="#f1f2f5"/><stop offset=".58" stop-color="#8e929b"/><stop offset=".78" stop-color="#dfe1e6"/><stop offset="1" stop-color="#6f737c"/>
  </linearGradient>
  <linearGradient id="platv" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f6f6f8"/><stop offset=".35" stop-color="#b3b6be"/><stop offset=".55" stop-color="#eceef1"/><stop offset="1" stop-color="#5f636b"/>
  </linearGradient>
  <linearGradient id="edge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4d55"/><stop offset="1" stop-color="#15161a"/></linearGradient>
  <radialGradient id="lacq" cx=".32" cy=".22" r=".9"><stop offset="0" stop-color="#1c1d21"/><stop offset=".45" stop-color="#09090b"/><stop offset="1" stop-color="#000"/></radialGradient>
  <radialGradient id="pool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".85"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <radialGradient id="stone" cx=".38" cy=".32" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#e9ecf2"/><stop offset=".7" stop-color="#9aa0ab"/><stop offset="1" stop-color="#3b3f47"/></radialGradient>
  <filter id="metal" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="7" result="b"/>
    <feDiffuseLighting in="b" surfaceScale="9" diffuseConstant="1" lighting-color="#e6e8ec" result="d"><feDistantLight azimuth="230" elevation="48"/></feDiffuseLighting>
    <feComposite in="d" in2="SourceAlpha" operator="in" result="di"/>
    <feBlend in="SourceGraphic" in2="di" mode="multiply" result="s"/>
    <feSpecularLighting in="b" surfaceScale="9" specularConstant="1.25" specularExponent="30" lighting-color="#ffffff" result="sp"><fePointLight x="520" y="260" z="1100"/></feSpecularLighting>
    <feComposite in="sp" in2="SourceAlpha" operator="in" result="spi"/>
    <feComposite in="spi" in2="s" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
  </filter>
  <filter id="metalfine" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="b"/>
    <feDiffuseLighting in="b" surfaceScale="5" diffuseConstant="1" lighting-color="#e6e8ec" result="d"><feDistantLight azimuth="230" elevation="48"/></feDiffuseLighting>
    <feComposite in="d" in2="SourceAlpha" operator="in" result="di"/>
    <feBlend in="SourceGraphic" in2="di" mode="multiply" result="s"/>
    <feSpecularLighting in="b" surfaceScale="5" specularConstant="1.2" specularExponent="26" lighting-color="#ffffff" result="sp"><fePointLight x="520" y="260" z="900"/></feSpecularLighting>
    <feComposite in="sp" in2="SourceAlpha" operator="in" result="spi"/>
    <feComposite in="spi" in2="s" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
  </filter>
  <filter id="shadow" x="-30%" y="-30%" width="160%" height="180%"><feGaussianBlur in="SourceAlpha" stdDeviation="28"/><feOffset dy="34" result="o"/><feComponentTransfer><feFuncA type="linear" slope=".75"/></feComponentTransfer></filter>
  <filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="10"/></filter>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="suede"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix type="matrix" values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .53  0 0 0 .08 0"/></filter>
  <pattern id="pave" width="34" height="30" patternUnits="userSpaceOnUse">
    <rect width="34" height="30" fill="#2a2c31"/>
    <circle cx="9" cy="8" r="7.6" fill="url(#stone)"/><circle cx="26" cy="23" r="7.6" fill="url(#stone)"/>
    <circle cx="6.2" cy="5.6" r="2.2" fill="#fff"/><circle cx="23.2" cy="20.6" r="2.2" fill="#fff"/>
    <circle cx="17.5" cy="8" r="1.4" fill="#cfd2d8"/><circle cx="0.5" cy="23" r="1.4" fill="#cfd2d8"/><circle cx="34.5" cy="23" r="1.4" fill="#cfd2d8"/><circle cx="17.5" cy="23" r="1.4" fill="#cfd2d8"/><circle cx="9" cy="23" r="1.4" fill="#cfd2d8"/><circle cx="26" cy="8" r="1.4" fill="#cfd2d8"/>
  </pattern>
  <path id="mk" d="${MARK}"/>
  <clipPath id="mkc"><use href="#mk"/></clipPath>
</defs>`;
function bg(kind) {
  return `<rect width="${V}" height="${H}" fill="url(#lacq)"/>` +
    (kind === "suede" ? `<rect width="${V}" height="${H}" filter="url(#suede)" opacity=".9"/>` : `<ellipse cx="${V * 0.3}" cy="${H * 0.16}" rx="${V * 0.7}" ry="${H * 0.16}" fill="#fff" opacity=".028" filter="url(#glow)"/>`);
}
/* the mark as a slab of platinum: an edge below it, the face on top, a highlight rim */
function slab(x, y, h, opts = {}) {
  const s = h / 1000, w = MARK_W * s, rot = opts.rot || 0, sx = opts.sx || 1, fill = opts.pave ? "url(#pave)" : "url(#plat)", th = opts.th || 12;
  const t = `translate(${x} ${y}) rotate(${rot}) scale(${sx} 1) translate(${-w / 2} ${-h / 2}) scale(${s})`;
  return `<g transform="${t}">
    <use href="#mk" fill="#000" filter="url(#shadow)" transform="translate(0 ${th * 2 / s})" opacity=".8"/>
    ${[...Array(6)].map((_, i) => `<use href="#mk" fill="url(#edge)" transform="translate(${(th / s) * (i + 1) / 6 * 0.35} ${(th / s) * (i + 1) / 6})"/>`).join("")}
    <g filter="url(#${opts.fine ? "metalfine" : "metal"})"><use href="#mk" fill="${fill}"/></g>
    ${opts.pave ? `<use href="#mk" fill="none" stroke="#f2f3f5" stroke-width="${8 / s / 4}" opacity=".7"/>` : `<use href="#mk" fill="none" stroke="#fff" stroke-width="${3 / s / 2}" opacity=".45"/>`}
  </g>`;
}
/* an oval-link chain along a path: links alternate flat and on edge */
function chain(d, n, size = 46) {
  const id = "cp" + Math.random().toString(36).slice(2, 7);
  let out = `<defs><path id="${id}" d="${d}"/></defs><g filter="url(#metalfine)">`;
  // sample with SVG at render time is not available here; approximate with de Casteljau on a cubic path string "M x y C ..." given as segments
  const pts = samplePath(d, n);
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], a = p.a * 180 / Math.PI, flat = i % 2 === 0;
    out += flat ? `<ellipse cx="${p.x}" cy="${p.y}" rx="${size}" ry="${size * 0.58}" transform="rotate(${a} ${p.x} ${p.y})" fill="none" stroke="url(#plat)" stroke-width="${size * 0.36}"/>`
      : `<rect x="${p.x - size * 0.92}" y="${p.y - size * 0.15}" width="${size * 1.84}" height="${size * 0.3}" rx="${size * 0.15}" transform="rotate(${a} ${p.x} ${p.y})" fill="url(#platv)"/>`;
  }
  return out + "</g>";
}
function samplePath(d, n) {
  // d: "M x y C c1x c1y c2x c2y x y C ..." multiple cubic segments
  const nums = d.replace(/[MC,]/g, " ").trim().split(/\s+/).map(Number);
  const segs = []; let sx = nums[0], sy = nums[1];
  for (let i = 2; i + 5 < nums.length; i += 6) { segs.push([[sx, sy], [nums[i], nums[i + 1]], [nums[i + 2], nums[i + 3]], [nums[i + 4], nums[i + 5]]]); sx = nums[i + 4]; sy = nums[i + 5]; }
  const bez = (P, t) => { const u = 1 - t; return [u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0], u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1]]; };
  const fine = []; segs.forEach((P) => { for (let k = 0; k <= 200; k++) fine.push(bez(P, k / 200)); });
  const L = [0]; for (let i = 1; i < fine.length; i++) L.push(L[i - 1] + Math.hypot(fine[i][0] - fine[i - 1][0], fine[i][1] - fine[i - 1][1]));
  const tot = L[L.length - 1], out = [];
  for (let i = 0; i < n; i++) { const want = tot * (i + 0.5) / n; let j = 0; while (L[j] < want) j++; const p = fine[j], q = fine[Math.min(fine.length - 1, j + 3)], r = fine[Math.max(0, j - 3)]; out.push({ x: p[0], y: p[1], a: Math.atan2(q[1] - r[1], q[0] - r[0]) }); }
  return out;
}
function brilliant(cx, cy, r) {
  const pts = (n, R, off = 0) => [...Array(n)].map((_, i) => { const a = off + i * 2 * Math.PI / n; return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`; }).join(" ");
  return `<g><circle cx="${cx}" cy="${cy}" r="${r * 1.12}" fill="#e9ebef" filter="url(#metalfine)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#stone)"/><polygon points="${pts(8, r * 0.62, 0.39)}" fill="#fff" opacity=".55"/><polygon points="${pts(8, r * 0.98, 0)}" fill="none" stroke="#fff" stroke-width="${r * 0.05}" opacity=".5"/><circle cx="${cx - r * 0.3}" cy="${cy - r * 0.32}" r="${r * 0.16}" fill="#fff"/></g>`;
}
function clasp(x, y, w, h, rot = 0, engrave = true) {
  const lw = 544, ls = (w * 0.56) / lw, lh = 100 * ls;
  return `<g transform="translate(${x} ${y}) rotate(${rot})">
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h * 0.22}" fill="#000" filter="url(#shadow)" opacity=".8"/>
    <rect x="${-w / 2 + 6}" y="${-h / 2 + 14}" width="${w}" height="${h}" rx="${h * 0.22}" fill="url(#edge)"/>
    <g filter="url(#metal)"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h * 0.22}" fill="url(#plat)"/></g>
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h * 0.22}" fill="none" stroke="#fff" stroke-width="2" opacity=".5"/>
    <line x1="${w * 0.36}" y1="${-h / 2 + h * 0.18}" x2="${w * 0.36}" y2="${h / 2 - h * 0.18}" stroke="#3a3c42" stroke-width="${h * 0.035}" stroke-linecap="round"/>
    ${engrave ? `<g transform="translate(${-w * 0.42} ${-lh / 2}) scale(${ls})" fill="none" stroke-linecap="butt" stroke-width="${7}">
      <g transform="translate(1.2 2)" stroke="#ffffff" opacity=".55">${LOGO.map((d) => `<path d="${d}"/>`).join("")}</g>
      <g stroke="#2b2d33">${LOGO.map((d) => `<path d="${d}"/>`).join("")}</g>
    </g>` : ""}
  </g>`;
}
/* reflection of a group on the lacquer */
const reflect = (inner, yAxis, alpha = 0.22) => `<g transform="translate(0 ${2 * yAxis}) scale(1 -1)" opacity="${alpha}" filter="url(#soft)" mask="url(#rmask)">${inner}</g>`;
const RMASK = (y0, y1) => `<mask id="rmask"><linearGradient id="rg" x1="0" y1="${y0}" x2="0" y2="${y1}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><rect width="${V}" height="${H}" fill="url(#rg)"/></mask>`;

const FRAMES = {
  /* I. the signature chain: the mark hangs at the centre of a slender oval-link chain on black lacquer */
  sig: () => {
    const cy = H * 0.5, cx = V * 0.5, h = 560, plateBottom = cy + h / 2;
    const left = `M -80 ${cy - 900} C 300 ${cy - 700} 240 ${cy - 260} ${cx - 150} ${cy - 20}`;
    const right = `M ${cx + 150} ${cy - 30} C 1500 ${cy + 40} 1450 ${cy + 560} 1690 ${cy + 640}`;
    const after = `M 1846 ${cy + 700} C 1950 ${cy + 730} 2000 ${cy + 720} 2080 ${cy + 690}`;
    const links = chain(left, 28) + chain(right, 26) + chain(after, 5), cl = clasp(1768, cy + 672, 250, 118, 18, true), plate = slab(cx, cy, h, { th: 14, rot: -5 });
    return bg("lacq") + `<ellipse cx="${cx}" cy="${plateBottom + 90}" rx="700" ry="150" fill="url(#pool)"/>` + RMASK(plateBottom, plateBottom + 700) + reflect(plate, plateBottom + 26, 0.18) + links + cl + plate;
  },
  /* the clasp, close: the engraving reads SILAVU */
  sigd: () => {
    const cx = V * 0.5, cy = H * 0.47;
    const d = `M -60 ${cy + 720} C 400 ${cy + 500} 500 ${cy + 300} ${cx - 640} ${cy + 60}`;
    const d2 = `M ${cx + 640} ${cy - 60} C 1500 ${cy - 340} 1500 ${cy - 700} 2060 ${cy - 860}`;
    const piece = chain(d, 12, 96) + chain(d2, 12, 96) + clasp(cx, cy, 1220, 560, -20, true);
    return bg("lacq") + `<ellipse cx="${cx}" cy="${cy + 420}" rx="900" ry="220" fill="url(#pool)"/>` + RMASK(cy + 260, cy + 1100) + reflect(piece, cy + 300, 0.16) + piece;
  },
  /* II. the drops: a pair, one flat, one on its edge, on suede */
  ear: () => {
    const h = 760, y = H * 0.55;
    const hook = (x, top, rot) => `<g transform="translate(${x} ${top}) rotate(${rot})"><path d="M 0 0 C -10 -70 -110 -130 -120 -220 C -125 -300 -40 -330 0 -290" fill="none" stroke="url(#platv)" stroke-width="16" stroke-linecap="round" filter="url(#metalfine)"/>${brilliant(0, 0, 34)}</g>`;
    const one = slab(V * 0.36, y, h, { rot: -8, th: 14 }) + hook(V * 0.36 + 40, y - h / 2 + 30, -8);
    const two = slab(V * 0.66, y + 80, h, { rot: 16, sx: 0.72, th: 20 }) + hook(V * 0.66 + 40, y + 80 - h / 2 + 24, 16);
    return bg("suede") + `<ellipse cx="${V * 0.5}" cy="${y + h * 0.55}" rx="900" ry="220" fill="url(#pool)"/>` + one + two;
  },
  /* the mark in pavé, close */
  eard: () => {
    const h = 1500, y = H * 0.52, x = V * 0.5;
    return bg("suede") + `<ellipse cx="${x}" cy="${y + h * 0.5}" rx="900" ry="260" fill="url(#pool)"/>` + slab(x, y, h, { rot: -6, th: 26, pave: true });
  },
  /* III. the seal: a knife-edge band, the mark in relief on its plaque, pavé shoulders */
  ring: () => {
    const cx = V * 0.5, cy = H * 0.5, rx = 560, ry = 220, bw = 92;
    const back = `<path d="M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy}" fill="none" stroke="url(#platv)" stroke-width="${bw}" filter="url(#metal)"/>`;
    const front = `<path d="M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy}" fill="none" stroke="url(#plat)" stroke-width="${bw}" filter="url(#metal)"/>`;
    const sh = (a) => brilliant(cx + rx * Math.cos(a), cy - ry * Math.sin(a), 21);
    const shoulders = [...Array(8)].map((_, i) => sh(Math.PI * (0.60 + i * 0.048))).join("") + [...Array(8)].map((_, i) => sh(Math.PI * (0.40 - i * 0.048))).join("");
    const gallery = `<path d="M ${cx - 250} ${cy - ry - 30} L ${cx + 250} ${cy - ry - 30} L ${cx + 300} ${cy - ry + 40} L ${cx - 300} ${cy - ry + 40} Z" fill="url(#edge)"/>`;
    const plate = `<g transform="translate(${cx} ${cy - ry - 250})">
      <rect x="-330" y="-330" width="660" height="700" rx="130" fill="#000" filter="url(#shadow)" opacity=".8"/>
      <rect x="-322" y="-316" width="660" height="700" rx="130" fill="url(#edge)"/>
      <g filter="url(#metal)"><rect x="-330" y="-330" width="660" height="700" rx="130" fill="url(#plat)"/></g>
      <rect x="-330" y="-330" width="660" height="700" rx="130" fill="none" stroke="#fff" stroke-width="2.5" opacity=".5"/>
      ${slab(0, 20, 500, { fine: true, th: 6 })}
    </g>`;
    const piece = back + gallery + shoulders + plate + front;
    return bg("lacq") + `<ellipse cx="${cx}" cy="${cy + ry + 80}" rx="780" ry="170" fill="url(#pool)"/>` + RMASK(cy + ry + 30, cy + ry + 720) + reflect(piece, cy + ry + 46, 0.16) + piece;
  },
  /* the plaque, close */
  ringd: () => {
    const cx = V * 0.5, cy = H * 0.5;
    const piece = `<g transform="translate(${cx} ${cy}) rotate(-9)">
      <rect x="-720" y="-760" width="1440" height="1520" rx="280" fill="#000" filter="url(#shadow)" opacity=".8"/>
      <rect x="-708" y="-736" width="1440" height="1520" rx="280" fill="url(#edge)"/>
      <g filter="url(#metal)"><rect x="-720" y="-760" width="1440" height="1520" rx="280" fill="url(#plat)"/></g>
      <rect x="-720" y="-760" width="1440" height="1520" rx="280" fill="none" stroke="#fff" stroke-width="3" opacity=".5"/>
      ${slab(0, 30, 1100, { th: 10 })}
    </g>`;
    return bg("lacq") + piece;
  },
};
const html = (svg) => `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#000}svg{display:block;width:100vw;height:auto}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${V} ${H}">${DEFS}${svg}</svg></body></html>`;
fs.mkdirSync(S + "out", { recursive: true });
for (const k of Object.keys(FRAMES)) fs.writeFileSync(S + "out/" + k + ".html", html(FRAMES[k]()));
console.log("frames:", Object.keys(FRAMES).join(" "));
