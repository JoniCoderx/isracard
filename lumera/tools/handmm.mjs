/* The hand in millimetres, against the measurements of a real one.
   Anthropometry (adult, 50th percentile):
     hand length wrist crease -> middle fingertip   F 172  M 189
     palm length wrist crease -> middle knuckle     F  95  M 105
     middle finger, knuckle -> tip                  F  77  M  84
     hand breadth across the knuckles               F  76  M  87
     wrist breadth                                  F  52  M  59  */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2400); await p.click("#enterBtn").catch(()=>{});
await p.waitForTimeout(900);
console.log(await p.evaluate(() => {
  const s = window.__lineSpec || {};
  const b = window.__build || {};
  return JSON.stringify({ wristCm: b.wrist, spec: { n: s.n, L: s.L }, }, null, 0);
}));
await b.close();
