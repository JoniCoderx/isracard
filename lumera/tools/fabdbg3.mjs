import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
const p = await ctx.newPage();
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" }); await p.waitForTimeout(3300); await p.tap("#enterBtn").catch(()=>{}); await p.waitForTimeout(900);
await p.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), 11816); await p.waitForTimeout(1100);
const r = await p.evaluate(() => { const f = document.getElementById("fab"); const fr = f.getBoundingClientRect(); const acts = [...document.querySelectorAll("#clients .acts > *")].map(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { t: e.textContent.trim().slice(0, 24), rect: [r.left|0, r.top|0, r.width|0, r.height|0], pe: cs.pointerEvents, op: cs.opacity, vis: cs.visibility }; }); return { fab: [fr.left|0, fr.top|0], acts }; });
console.log(JSON.stringify(r)); await p.screenshot({ path: "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/v14/mob3/fab-11816.png" }); await b.close();
