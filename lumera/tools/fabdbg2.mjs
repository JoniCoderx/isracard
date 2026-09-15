import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
const p = await ctx.newPage();
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" }); await p.waitForTimeout(3300); await p.tap("#enterBtn").catch(()=>{}); await p.waitForTimeout(900);
for (const y of [12660, 11816, 4220]) {
  await p.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y); await p.waitForTimeout(1100);
  const r = await p.evaluate(() => { const f = document.getElementById("fab"); const r = f.getBoundingClientRect(); const pts = [r.left + 6, r.left + r.width / 2, r.right - 6].map(x => document.elementsFromPoint(x, r.top + r.height / 2).filter(e => e !== f && !f.contains(e)).slice(0, 2).map(e => e.tagName + "#" + e.id + "." + String(e.className).slice(0, 18))); return { cls: f.className, rect: [r.left|0, r.top|0, r.width|0, r.height|0], pts }; });
  console.log(y, JSON.stringify(r));
}
await b.close();
