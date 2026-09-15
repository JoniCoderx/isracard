import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
const p = await ctx.newPage();
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" }); await p.waitForTimeout(3300); await p.tap("#enterBtn").catch(()=>{}); await p.waitForTimeout(900);
await p.click("#menuBtn"); await p.waitForTimeout(600); await p.evaluate(() => document.querySelector('#mlist a[href="#clients"]').click()); await p.waitForTimeout(2300);
const r = await p.evaluate(() => { const f = document.getElementById("fab"); const r = f.getBoundingClientRect(); const els = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2).map(e => e.tagName + "#" + e.id + "." + String(e.className).slice(0, 24)); return { cls: f.className, rect: [r.left|0, r.top|0, r.width|0, r.height|0], els: els.slice(0, 6), y: scrollY, ctop: document.getElementById("concierge").getBoundingClientRect().top|0, ih: innerHeight }; });
console.log(JSON.stringify(r)); await b.close();
