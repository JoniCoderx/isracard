import fs from "node:fs";
import sharp from "sharp";
import { MARK_B, MARK_BW } from "../site/src/body.mjs";
const OUT = "/home/user/isracard/lumera/site/public";
const S = 0.05, w = MARK_BW * S, h = 1000 * S;
const tx = ((64 - w) / 2).toFixed(2), ty = ((64 - h) / 2).toFixed(2);
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
  + '<defs><linearGradient id="t" x1="0" y1="0" x2="1" y2="1">'
  + '<stop offset="0" stop-color="#eadfc2"/><stop offset="1" stop-color="#c9b483"/></linearGradient></defs>'
  + '<rect width="64" height="64" rx="14" fill="url(#t)"/>'
  + '<path transform="translate(' + tx + ' ' + ty + ') scale(' + S + ')" fill="#0d0c0a" d="' + MARK_B + '"/></svg>';
fs.writeFileSync(OUT + "/favicon.svg", svg);
console.log("favicon.svg written from the official small-size cut (" + svg.length + " bytes)");

const png = (n) => sharp(Buffer.from(svg)).resize(n, n).png().toBuffer();
const sizes = [16, 32, 48, 180, 192, 512];
const bufs = {};
for (const n of sizes) { bufs[n] = await png(n); fs.writeFileSync(OUT + "/icon-" + n + ".png", bufs[n]); }
console.log("icon PNGs written: " + sizes.join(", "));

/* an .ico is a small directory of PNG payloads */
const ico = (list) => {
  const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(list.length, 4);
  let off = 6 + 16 * list.length; const dirs = [], datas = [];
  for (const [n, buf] of list) {
    const d = Buffer.alloc(16);
    d[0] = n >= 256 ? 0 : n; d[1] = n >= 256 ? 0 : n; d[2] = 0; d[3] = 0;
    d.writeUInt16LE(1, 4); d.writeUInt16LE(32, 6);
    d.writeUInt32LE(buf.length, 8); d.writeUInt32LE(off, 12);
    off += buf.length; dirs.push(d); datas.push(buf);
  }
  return Buffer.concat([head, ...dirs, ...datas]);
};
fs.writeFileSync(OUT + "/favicon.ico", ico([[16, bufs[16]], [32, bufs[32]], [48, bufs[48]]]));
console.log("favicon.ico written with 16/32/48");
