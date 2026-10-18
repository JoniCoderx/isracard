// "The cut" (/test4/), rendered once instead of live: the round brilliant of
// src/t4/gem.js, traced at twice the size and brought down (so its edges are
// clean), with more bounces inside the stone than a page could afford, at
// every point of the chapter. The page plays these frames with the scroll,
// as it plays SOUL's, so the reader's device does no 3D work at all.
//   public/f/cut/d-NNN.webp (wide screens, 1400 px square)
//   public/f/cut/m-NNN.webp (phones, 820 px square)
//   cut-anchors.json (where each named part of the stone is, frame by frame)
// The views are the ones the page used to draw live: see view() below.
// Needs Chromium (Playwright). Usage: node cut-frames.mjs [first] [last]
import fs from "node:fs";
import path from "node:path";
import pw from "../node_modules/playwright-core/index.js";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const N = 120, OUT = path.join(HERE, "public/f/cut");
const [from = 0, to = N - 1] = process.argv.slice(2).map(Number);
fs.mkdirSync(OUT, { recursive: true });
const SETS = [
  { k: "d", px: 1400, ss: 2, size: tf => 0.36 + tf * 0.05 },
  { k: "m", px: 820, ss: 2, size: tf => 0.25 + tf * 0.08 }
];
const gemSrc = fs.readFileSync(path.join(HERE, "src/t4/gem.js"), "utf8");
const b = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await b.newPage();
await page.setContent(`<!doctype html><canvas id="g"></canvas><canvas id="o"></canvas><script>${gemSrc}</script>`);
const anchors = fs.existsSync(path.join(HERE, "cut-anchors.json")) ? JSON.parse(fs.readFileSync(path.join(HERE, "cut-anchors.json"), "utf8")) : {};
for (const S of SETS) {
  anchors[S.k] = anchors[S.k] || new Array(N).fill(0);
  await page.evaluate(({ px, ss }) => {
    const g = document.getElementById("g"); g.width = g.height = px * ss;
    window.G = SilavuGem(g, { bounces: 8, lw: ss * 1.25 });
    const o = document.getElementById("o"); o.width = o.height = px;
  }, { px: S.px, ss: S.ss });
  for (let i = from; i <= to; i++) {
    const q = i / (N - 1);
    /* the views: the drawing, then the light, then it turns to face you */
    const lit = Math.min(1, Math.max(0, (q - 0.13) / 0.16));
    let tf = Math.min(1, Math.max(0, (q - 0.46) / 0.26)); tf = tf * tf * (3 - 2 * tf);
    const wire = 1 - Math.min(1, Math.max(0, (q - 0.2) / 0.14));
    const labels = q > 0.05 && q < 0.44;
    const res = await page.evaluate(({ px, v, labels }) => {
      v.y = -G.mid * (1 - v.tf);
      G.draw(v);
      const o = document.getElementById("o"), c = o.getContext("2d");
      c.fillStyle = "#0b0b0c"; c.fillRect(0, 0, px, px);
      const gr = c.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
      gr.addColorStop(0, "rgba(255,255,255,0.07)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = gr; c.fillRect(0, 0, px, px);
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
      c.drawImage(document.getElementById("g"), 0, 0, px, px);
      const a = labels ? ["table", "crown", "girdle", "pavilion", "culet"].map(n => { const p = G.project(n, v); return [+p.x.toFixed(4), +p.y.toFixed(4)]; }) : 0;
      return { url: o.toDataURL("image/webp", 0.86), a };
    }, { px: S.px, labels, v: { tilt: tf * 1.38, spin: q * 4.4, yaw: 0, wire, lit, size: S.size(tf), tf } });
    fs.writeFileSync(path.join(OUT, `${S.k}-${String(i).padStart(3, "0")}.webp`), Buffer.from(res.url.split(",")[1], "base64"));
    anchors[S.k][i] = res.a;
    process.stdout.write(`${S.k}${i} `);
  }
}
fs.writeFileSync(path.join(HERE, "cut-anchors.json"), JSON.stringify(anchors));
await b.close();
console.log("\ncut frames written");
