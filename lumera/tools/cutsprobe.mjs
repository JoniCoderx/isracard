import { chromium } from "playwright-core"; import fs from "fs";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/v14/cuts/"; fs.mkdirSync(OUT, { recursive: true });
const mob = process.argv[2] === "m";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const ctx = await b.newContext(mob ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: false } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(String(e.message).slice(0, 160))); p.on("console", m => { if (m.type()==="error" && !/ERR_|Failed to load/.test(m.text())) errs.push(m.text().slice(0,160)); });

await p.goto("http://127.0.0.1:8765/index.html", { waitUntil:"load" }); await p.waitForTimeout(3300); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(900);
await p.evaluate(() => window.scrollTo({ top: scrollY + document.getElementById("stripwrap").getBoundingClientRect().top - 90, behavior: "instant" })); await p.waitForTimeout(1800);
const tag = mob ? "m-" : "d-"; const r = {};
const wrap = await p.$("#stripwrap");
r.round = await p.evaluate(() => ({ spec: window.__lineSpec, sum: document.getElementById("sumStones").textContent, mm: document.getElementById("eachMm").textContent, est: document.getElementById("est").textContent, sprite: !!window.__stoneSprite, cut: window.__stoneSpriteCut }));
await wrap.screenshot({ path: OUT + tag + "round.png" });
for (const c of ["oval", "marquise", "emerald", "baguette", "pear", "princess", "cushion"]) {
  await p.evaluate((c) => document.querySelector('.chip[data-k="cut"][data-v="' + c + '"]').click(), c); await p.waitForTimeout(900);
  r[c] = await p.evaluate(() => ({ n: window.__lineSpec.n, L: +window.__lineSpec.L.toFixed(2), W: +window.__lineSpec.W.toFixed(2), sum: document.getElementById("sumStones").textContent, mm: document.getElementById("eachMm").textContent, est: document.getElementById("est").textContent, cut: window.__stoneSpriteCut, stone1: document.getElementById("stone1").style.cssText.slice(0, 80) }));
  if (["oval", "marquise", "emerald", "baguette"].includes(c)) await wrap.screenshot({ path: OUT + tag + c + ".png" });
}
// the wrist view
await p.evaluate(() => document.querySelector('.chip[data-k="cut"][data-v="oval"]').click()); await p.waitForTimeout(400);
await p.evaluate(() => document.querySelector('.vtb[data-view="wrist"]').click()); await p.waitForTimeout(2200);
r.wrist = await p.evaluate(() => { const w = document.getElementById("stripwrap"); const rc = w.getBoundingClientRect(); return { cls: w.className, size: [Math.round(rc.width), Math.round(rc.height)], cv: [document.getElementById("stripcv").width, document.getElementById("stripcv").height] }; });
await p.evaluate(() => window.scrollTo({ top: scrollY + document.getElementById("stripwrap").getBoundingClientRect().top - 90, behavior: "instant" })); await p.waitForTimeout(600);
await wrap.screenshot({ path: OUT + tag + "wrist-oval.png" });
const bb = await wrap.boundingBox();
if (mob) { const cdp = await ctx.newCDPSession(p); const x0 = bb.x + bb.width * 0.5, y0 = bb.y + bb.height * 0.6; await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y: y0 }] }); for (let k = 1; k <= 10; k++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + k * 9, y: y0 }] }); await p.waitForTimeout(30); } await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); }
else { await p.mouse.move(bb.x + bb.width * 0.5, bb.y + bb.height * 0.5); await p.mouse.down(); for (let k = 1; k <= 10; k++) { await p.mouse.move(bb.x + bb.width * 0.5, bb.y + bb.height * 0.5 + k * 8); await p.waitForTimeout(30); } await p.mouse.up(); }
await p.waitForTimeout(500); r.scrollAfterDrag = await p.evaluate(() => scrollY);
await wrap.screenshot({ path: OUT + tag + "wrist-turned.png" });
await p.evaluate(() => document.querySelector('.chip[data-k="cut"][data-v="baguette"]').click()); await p.waitForTimeout(1200); await wrap.screenshot({ path: OUT + tag + "wrist-baguette.png" });
await p.evaluate(() => document.querySelector('.chip[data-k="metal"][data-v="yellow"]').click()); await p.evaluate(() => document.querySelector('.chip[data-k="cut"][data-v="marquise"]').click()); await p.waitForTimeout(1200); await wrap.screenshot({ path: OUT + tag + "wrist-marquise-yellow.png" });
// the chain with the marquise
await p.evaluate(() => document.querySelector('.vtb[data-view="line"]').click()); await p.waitForTimeout(300);
await p.evaluate(() => { const el = document.getElementById("pickup"); window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - (innerWidth < 700 ? 420 : 500), behavior: "instant" }); }); await p.waitForTimeout(500);
await p.click("#pickup"); await p.waitForTimeout(2200);
r.chain = await p.evaluate(() => ({ n: window.__chain.pts.length, on: window.__chain.on }));
const url = await p.evaluate(() => document.getElementById("play").toDataURL("image/png")); fs.writeFileSync(OUT + tag + "chain-marquise.png", Buffer.from(url.split(",")[1], "base64"));
await p.click("#putback").catch(() => {});
r.errors = errs.slice(0, 6); console.log(JSON.stringify(r, null, 1)); await b.close();
