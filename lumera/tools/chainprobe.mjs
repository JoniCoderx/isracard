import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: false });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(String(e.message).slice(0, 100)));
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" }); await p.waitForTimeout(3300); await p.tap("#enterBtn").catch(()=>{}); await p.waitForTimeout(900);
await p.evaluate(() => { const el = document.getElementById("pickup"); window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - 420, behavior: "instant" }); }); await p.waitForTimeout(600);
await p.tap("#pickup"); await p.waitForTimeout(2500);
await p.evaluate(() => { window.__dbg = []; document.addEventListener("touchstart", e => window.__dbg.push([e.defaultPrevented, e.target.tagName, String(e.target.className).slice(0,30), Math.round(e.touches[0].clientX), Math.round(e.touches[0].clientY), window.__chain.on]), { passive: true }); document.addEventListener("pointerdown", e => window.__dbg.push(["pd", e.pointerType, e.defaultPrevented]), true); document.addEventListener("pointercancel", e => window.__dbg.push(["cancel"]), true); });
const before = await p.evaluate(() => ({ y: scrollY, pts: window.__chain.pts.map(q => [Math.round(q.x), Math.round(q.y)]) }));
const bead = before.pts[5]; const cdp = await ctx.newCDPSession(p);
await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: bead[0], y: bead[1] }] });
for (let k = 1; k <= 14; k++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: bead[0] + k * 4, y: bead[1] - k * 22 }] }); await p.waitForTimeout(30); }
const mid = await p.evaluate(() => ({ y: scrollY, p5: [Math.round(window.__chain.pts[5].x), Math.round(window.__chain.pts[5].y)] }));
await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await p.waitForTimeout(800);
await p.screenshot({ path: "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/v14/mob/chain-held.png" });
const dbg = await p.evaluate(() => window.__dbg); console.log(JSON.stringify({ dbg, bead, mid, scrollUnchanged: before.y === mid.y, moved: Math.abs(mid.p5[1] - bead[1]) > 100, errs }));
await b.close();
