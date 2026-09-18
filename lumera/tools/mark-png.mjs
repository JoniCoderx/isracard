/* Rasterise the SILAVU mark straight out of the source of truth, so anything
   generated from it carries the real icon and not something like it. */
import { chromium } from "playwright-core";
import { MARK, MARK_W, MARK_B, MARK_BW, MARK_XS, MARK_XSW } from "../site/src/body.mjs";
const OUT = process.argv[2] || "/tmp/mark";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
for (const [name, d, w] of [["mark", MARK, MARK_W], ["markb", MARK_B, MARK_BW], ["markxs", MARK_XS, MARK_XSW]]) {
  const W = Math.ceil(w), H = 1000, S = 2000 / H;
  const p = await b.newPage({ viewport: { width: Math.round(W * S), height: Math.round(H * S) } });
  await p.setContent(`<style>html,body{margin:0;background:#fff}svg{display:block;width:100%;height:100%}</style>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><path d="${d}" fill="#000"/></svg>`);
  await p.screenshot({ path: `${OUT}-${name}.png` });
  console.log(name, W + "x" + H, "->", Math.round(W * S) + "x" + Math.round(H * S));
  await p.close();
}
await b.close();
