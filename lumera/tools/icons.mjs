/* The house icon, generated from the house path.

   Black tile, white mark, filling the tile — a favicon is 16 pixels on a
   crowded tab strip, so it has to read as one confident shape rather than as
   a small drawing with a margin around it. The small sizes use the tighter
   cut of the mark, because the hairlines of the display cut vanish below
   about 32px and what is left looks like a smudge. */
import { chromium } from "playwright-core";
import fs from "node:fs";
import { MARK_B, MARK_BW, MARK_XS, MARK_XSW } from "../site/src/body.mjs";

const OUT = process.argv[2] || "site/public";
const BG = "#000000", FG = "#ffffff";

/* how much of the tile the mark's height takes. Bigger than a usual logo
   lockup on purpose: the user has to spot it in a tab strip. */
const FILL = { 16: 0.90, 32: 0.86, 48: 0.84, 180: 0.78, 192: 0.78, 512: 0.76 };

function svg(size, radius) {
  const tight = size <= 48;
  const d = tight ? MARK_XS : MARK_B, w = tight ? MARK_XSW : MARK_BW;
  const fill = FILL[size] ?? 0.78;
  const h = size * fill, s = h / 1000, mw = w * s;
  const x = (size - mw) / 2, y = (size - h) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`
    + `<rect width="${size}" height="${size}"${radius ? ` rx="${radius}"` : ""} fill="${BG}"/>`
    + `<path transform="translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${s.toFixed(6)})" fill="${FG}" d="${d}"/></svg>`;
}

/* an .ico is a tiny directory followed by whole PNG files */
function ico(pngs) {
  const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  let offset = 6 + pngs.length * 16;
  const dir = [], body = [];
  for (const { size, buf } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(buf.length, 8); e.writeUInt32LE(offset, 12);
    offset += buf.length; dir.push(e); body.push(buf);
  }
  return Buffer.concat([head, ...dir, ...body]);
}

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const png = async (size) => {
  const p = await b.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await p.setContent(`<style>html,body{margin:0}svg{display:block}</style>${svg(size, 0)}`);
  const buf = await p.screenshot({ type: "png" });
  await p.close();
  return buf;
};

for (const size of [16, 32, 48, 180, 192, 512]) {
  fs.writeFileSync(`${OUT}/icon-${size}.png`, await png(size));
  console.log("icon-" + size + ".png");
}
fs.writeFileSync(`${OUT}/favicon.ico`, ico(await Promise.all([16, 32, 48].map(async s => ({ size: s, buf: await png(s) })))));
console.log("favicon.ico");
/* the SVG favicon keeps a small radius: it is the one browsers show unmasked */
fs.writeFileSync(`${OUT}/favicon.svg`, svg(64, 12));
console.log("favicon.svg");
await b.close();
