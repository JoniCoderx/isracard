import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const DIR = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/v15";
import fs from "fs"; fs.mkdirSync(DIR, { recursive:true });
const open = async (w, h, reduce) => {
  const p = await b.newPage({ viewport:{ width:w, height:h } });
  if (reduce) await p.emulateMedia({ reducedMotion:"reduce" });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" });
  await p.waitForTimeout(2800); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
  await p.waitForTimeout(1400); return p;
};
const shot = async (p, id, name, off = 0) => {
  await p.evaluate(([i, o]) => { const e = document.getElementById(i); window.scrollTo({ top: scrollY + e.getBoundingClientRect().top + o, behavior:"instant" }); }, [id, off]);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${DIR}/${name}.png` });
};
/* desktop */
let p = await open(1440, 900, true);
await shot(p, "bespoke", "d-bespoke");
await shot(p, "collection", "d-collection", 200);
await shot(p, "what", "d-what");
await p.close();
/* the house mark, the moment it is first seen, with motion on */
p = await b.newPage({ viewport:{ width:1440, height:900 } });
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" });
await p.waitForTimeout(500); await p.screenshot({ path: `${DIR}/d-loader-500ms.png` });
await p.waitForTimeout(2300); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
await p.waitForTimeout(1200);
await p.evaluate(() => { const e = document.getElementById("house"); window.scrollTo({ top: scrollY + e.getBoundingClientRect().top, behavior:"instant" }); });
await p.waitForTimeout(800); await p.screenshot({ path: `${DIR}/d-housemark.png` });
/* and as it leaves */
await p.evaluate(() => window.scrollBy({ top: 420, behavior:"instant" })); await p.waitForTimeout(600);
await p.screenshot({ path: `${DIR}/d-housemark-leaving.png` });
await p.close();
/* mobile */
for (const w of [320, 390, 430]) {
  const m = await open(w, w === 320 ? 720 : 844, true);
  await shot(m, "bespoke", `m${w}-bespoke`);
  await shot(m, "build", `m${w}-build`, 300);
  await shot(m, "what", `m${w}-what`);
  await m.close();
}
console.log("shots in " + DIR);
await b.close();
