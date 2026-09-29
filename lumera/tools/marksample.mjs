import { chromium } from "playwright-core";
import { MARK_B, MARK_BW } from "../site/src/body.mjs";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage();
await p.setContent(`<svg id="s" viewBox="0 0 ${Math.ceil(MARK_BW)} 1000"><path id="m" d="${MARK_B}"/></svg>`);
const info = await p.evaluate(() => {
  const m = document.getElementById("m");
  const L = m.getTotalLength();
  const bb = m.getBBox();
  const pts = [];
  const N = 240;
  for (let i = 0; i < N; i++) { const q = m.getPointAtLength(L * i / N); pts.push([+q.x.toFixed(1), +q.y.toFixed(1)]); }
  return { L: Math.round(L), bb: { x: Math.round(bb.x), y: Math.round(bb.y), w: Math.round(bb.width), h: Math.round(bb.height) }, n: pts.length, first: pts.slice(0, 4), subpaths: (document.getElementById("m").getAttribute("d").match(/M/gi) || []).length };
});
console.log(JSON.stringify(info, null, 1));
console.log("viewBox width", Math.ceil(MARK_BW), "path chars", MARK_B.length);
await b.close();
