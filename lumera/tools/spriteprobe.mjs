import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(String(e.message).slice(0, 100)));
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" }); await p.waitForTimeout(3300); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(900);
await p.evaluate(() => window.scrollTo({ top: scrollY + document.getElementById("stripwrap").getBoundingClientRect().top - 120, behavior: "instant" })); await p.waitForTimeout(2500);
const r = await p.evaluate(() => { const s = window.__stoneSprite; if (!s) return { sprite: false }; const c = s.getContext("2d"), d = c.getImageData(0, 0, s.width, s.height).data; let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; for (let y = 0; y < s.height; y++) for (let x = 0; x < s.width; x++) { if (d[(y * s.width + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } } return { sprite: true, size: s.width, box: [x0, y0, x1, y1], fillW: (x1 - x0 + 1) / s.width, fillH: (y1 - y0 + 1) / s.height, strip: window.__strip }; });
const wrap = await p.$("#stripwrap"); await wrap.screenshot({ path: "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/v14/wrist/strip-before.png" });
console.log(JSON.stringify({ r, errs })); await b.close();
