import { chromium } from "playwright-core";
import fs from "fs";
const DIR = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/v16";
fs.mkdirSync(DIR, { recursive:true });
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{ width:1440, height:900 } });
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" });
await p.waitForTimeout(2800); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
await p.waitForTimeout(1200);
await p.evaluate(() => { const e = document.getElementById("house"); window.scrollTo({ top: scrollY + e.getBoundingClientRect().top, behavior:"instant" }); });
await p.waitForTimeout(700);
for (const d of [140, 240, 330]) {
  await p.evaluate(v => window.scrollBy({ top: v, behavior:"instant" }), d === 140 ? 140 : 100);
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${DIR}/mark-${d}.png`, clip:{ x:380, y:0, width:680, height:560 } });
}
/* the collection meta, after the divider fix */
await p.evaluate(() => { const e = document.getElementById("collection"); window.scrollTo({ top: scrollY + e.getBoundingClientRect().top + 200, behavior:"instant" }); });
await p.waitForTimeout(1400); await p.screenshot({ path: `${DIR}/collection.png` });
/* the bottom of bespoke */
await p.evaluate(() => { const e = document.getElementById("bespoke"); window.scrollTo({ top: scrollY + e.getBoundingClientRect().bottom - innerHeight, behavior:"instant" }); });
await p.waitForTimeout(1200); await p.screenshot({ path: `${DIR}/bespoke-foot.png` });
await p.close();
const m = await b.newPage({ viewport:{ width:320, height:720 } });
await m.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" });
await m.waitForTimeout(2800); await m.click("#enterBtn", { timeout:4000 }).catch(() => {});
await m.waitForTimeout(1200); await m.screenshot({ path: `${DIR}/m320-hero.png` });
await m.evaluate(() => { const e = document.getElementById("collection"); window.scrollTo({ top: scrollY + e.getBoundingClientRect().top + 300, behavior:"instant" }); });
await m.waitForTimeout(1400); await m.screenshot({ path: `${DIR}/m320-collection.png` });
await m.close();
console.log("ok");
await b.close();
