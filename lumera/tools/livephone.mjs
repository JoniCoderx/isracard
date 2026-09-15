import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/v14/live/";
import fs from "fs"; fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", proxy: { server: process.env.HTTPS_PROXY }, args:["--no-sandbox","--ignore-certificate-errors","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(String(e.message).slice(0, 120))); p.on("console", m => { if (m.type()==="error") errs.push(m.text().slice(0,120)); });
const r = {};
await p.goto("https://silavu-house.higgsfield.app/", { waitUntil: "networkidle", timeout: 90000 }); await p.waitForTimeout(3300);
r.html = await p.evaluate(() => ({ viewportMeta: !!document.querySelector('meta[name="viewport"]'), newCode: document.documentElement.outerHTML.includes("fabClear"), lockupPx: getComputedStyle(document.querySelector(".sh .mark")).fontSize, h1: document.querySelector("h1").textContent.trim().slice(0, 60), heroP: document.querySelector(".hcap p, .hero p") && document.querySelector(".hcap p, .hero p").textContent.trim().slice(0, 60) }));
await p.tap("#enterBtn").catch(() => {}); await p.waitForTimeout(1200);
await p.screenshot({ path: OUT + "hero.png" });
await p.evaluate(() => { const el = document.getElementById("pickup"); window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - 420, behavior: "instant" }); }); await p.waitForTimeout(900);
await p.tap("#pickup"); await p.waitForTimeout(2500);
r.chain = await p.evaluate(() => { const cv = document.getElementById("play"); const rc = cv.getBoundingClientRect(); const pts = window.__chain.pts; const ys = pts.map(q => q.y), xs = pts.map(q => q.x); return { on: window.__chain.on, cssSize: [Math.round(rc.width), Math.round(rc.height)], pixelSize: [cv.width, cv.height], inView: Math.max(...ys) < innerHeight && Math.min(...ys) > 0 && Math.max(...xs) < innerWidth, sprite: !!window.__stoneSprite, pickupOpacity: getComputedStyle(document.getElementById("pickup")).opacity, putbackShown: document.getElementById("putback").classList.contains("on"), fabShown: document.getElementById("fab").classList.contains("show") }; });
const before = await p.evaluate(() => ({ y: scrollY, p5: [Math.round(window.__chain.pts[5].x), Math.round(window.__chain.pts[5].y)] }));
const cdp = await ctx.newCDPSession(p);
await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: before.p5[0], y: before.p5[1] }] });
for (let k = 1; k <= 14; k++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: before.p5[0] + k * 4, y: before.p5[1] - k * 22 }] }); await p.waitForTimeout(30); }
const mid = await p.evaluate(() => ({ y: scrollY, p5: [Math.round(window.__chain.pts[5].x), Math.round(window.__chain.pts[5].y)] }));
await p.screenshot({ path: OUT + "held.png" });
await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await p.waitForTimeout(900);
r.drag = { before: before.p5, during: mid.p5, moved: Math.abs(mid.p5[1] - before.p5[1]) > 100, scrollUnchanged: before.y === mid.y };
await p.screenshot({ path: OUT + "dropped.png" });
await p.tap("#putback"); await p.waitForTimeout(500);
r.putBack = await p.evaluate(() => ({ on: window.__chain.on, pickupOpacity: getComputedStyle(document.getElementById("pickup")).opacity }));
// the floating button never rests on words or buttons
const fab = [];
for (const y of [4200, 9000, 11800, 12600, 15200]) { await p.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y); await p.waitForTimeout(1200); fab.push(await p.evaluate(() => { const f = document.getElementById("fab"); const rr = f.getBoundingClientRect(); const hasText = (el) => { for (let c = el.firstChild; c; c = c.nextSibling) if (c.nodeType === 3 && c.nodeValue.trim()) return true; return false; }; const busy = [rr.left + 5, rr.left + rr.width / 2, rr.right - 5].some(x => [rr.top + 4, rr.top + rr.height / 2, rr.bottom - 4].some(yy => { const els = document.elementsFromPoint(x, yy).filter(e => e !== f && !f.contains(e)); return els.length > 0 && (/^(P|H1|H2|H3|H4|LI|A|BUTTON|INPUT|TEXTAREA|SELECT|LABEL|SPAN|SMALL|EM|STRONG|BLOCKQUOTE|FIGCAPTION|TD|TH|SVG|DT|DD|IMG|CANVAS|VIDEO)$/.test(els[0].tagName) || hasText(els[0]) || !!els[0].closest(".btn, .chip, .modal, form")); })); return { y: scrollY, shown: f.classList.contains("show"), busy }; })); }
r.fab = fab; r.fabNeverOverlaps = fab.every(f => !(f.shown && f.busy));
r.errors = errs.filter(e => !/favicon|ERR_|Failed to load/.test(e)).slice(0, 5);
console.log(JSON.stringify(r, null, 1)); await b.close();
