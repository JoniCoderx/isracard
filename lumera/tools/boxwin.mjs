// Calibrate the box chapter's frame window. Real-weight frames (served from
// BOXREAL), a throttled network and CPU, then a reading-speed scroll down
// through the chapter, back up, and a fast flick down. For each window size:
// how often the frame on screen is not the frame the playhead asks for
// (a hold), the worst gap, how many decoded frames are held at peak, and
// how much of the strip is fetched before the chapter is reached.
import { chromium } from "playwright-core";
import fs from "fs";
const BOXREAL = process.env.BOXREAL, U = process.env.U || "http://localhost:8777/";
const WINS = (process.env.WINS || "0").split(",").map(Number);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const PROF = { phone: { vp: { width: 390, height: 844 }, mob: true, cpu: 4, net: { latency: 70, downloadThroughput: 12e6 / 8, uploadThroughput: 3e6 / 8 } },
               desktop: { vp: { width: 1440, height: 900 }, mob: false, cpu: 1, net: { latency: 40, downloadThroughput: 40e6 / 8, uploadThroughput: 10e6 / 8 } } };
for (const [pn, P] of Object.entries(PROF)) for (const win of WINS) {
  const c = await b.newContext({ viewport: P.vp, isMobile: P.mob, hasTouch: P.mob, deviceScaleFactor: P.mob ? 2 : 1 });
  const p = await c.newPage(); const cdp = await c.newCDPSession(p);
  await cdp.send("Network.enable"); await cdp.send("Network.emulateNetworkConditions", { offline: false, ...P.net });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: P.cpu });
  let boxBytes = 0, boxReq = 0, phase = "load"; const byPhase = {}, reqs = new Map(), cached = new Set();
  // no request interception (it would switch the HTTP cache off): count what really crossed the network
  cdp.on("Network.loadingFinished", e => { const u = reqs.get(e.requestId); if (u && !cached.has(e.requestId)) { boxBytes += e.encodedDataLength; boxReq++; byPhase[phase] = (byPhase[phase] || 0) + e.encodedDataLength; } });
  cdp.on("Network.requestWillBeSent", e => { if (/\/f\/box\//.test(e.request.url)) reqs.set(e.requestId, e.request.url); });
  cdp.on("Network.requestServedFromCache", e => cached.add(e.requestId));
  cdp.on("Network.responseReceived", e => { if (e.response.fromDiskCache || e.response.fromMemoryCache) cached.add(e.requestId); });
  if (win) await p.addInitScript(w => { window.__boxwin = w; }, win);
  if (process.env.SKEL) await p.addInitScript(k => { window.__boxskel = k; }, +process.env.SKEL);
  await p.goto(U, { waitUntil: "load" }); await p.waitForTimeout(1500); await p.waitForSelector("#enterBtn", { timeout: 15000 }).catch(() => {}); await p.evaluate(() => { const e = document.getElementById("enterBtn"); if (e) e.click(); }); await p.waitForFunction(() => !document.documentElement.classList.contains("locked") && document.documentElement.scrollHeight > 6000, null, { timeout: 30000 }); await p.waitForTimeout(1500); await p.evaluate(() => { scrollTo(0, 3000); }); await p.waitForFunction(() => scrollY > 2500, null, { timeout: 10000 }); await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(500);
  await p.waitForTimeout(1500); const atLoad = byPhase.load || 0; phase = "scroll";
  const run = (speed, dir) => p.evaluate(([speed, dir]) => new Promise(res => {
    document.documentElement.style.scrollBehavior = "auto";
    const pin = document.getElementById("stonepin"), top = pin.getBoundingClientRect().top + scrollY, H = pin.offsetHeight;
    const from = dir > 0 ? top - innerHeight * 0.8 : top + H - innerHeight * 0.2, to = dir > 0 ? top + H - innerHeight * 0.2 : top - innerHeight * 0.8;
    scrollTo(0, from); let y = from, t0 = 0, n = 0, miss = 0, worst = 0; const N = 95;
    function f(t) { if (!t0) t0 = t; const dt = Math.min(50, t - (f.t || t)); f.t = t; y += dir * speed * dt / 1000; scrollTo(0, y);
      const bx = window.__box; if (bx && bx.p >= 0 && bx.p <= 1 && bx.frame >= 0) { const want = Math.round(bx.p * N), gap = Math.abs(want - bx.frame); n++; if (gap > 2) miss++; if (gap > worst) worst = gap; }
      if ((dir > 0 && y >= to) || (dir < 0 && y <= to)) { setTimeout(() => res({ n, miss, worst, peak: window.__box.peak, held: window.__box.held }), 400); return; }
      requestAnimationFrame(f); }
    requestAnimationFrame(f); }), [speed, dir]);
  const slow = await run(500, 1), up = await run(1400, -1), down = await run(1400, 1), flick = await run(5000, -1);
  console.log(`${process.env.TAG || ""} ${pn} win=${String(win || "site").padStart(4)} skel=${process.env.SKEL || "site"} at load ${Math.round(atLoad / 1024)}KB | slow holds ${slow.miss}/${slow.n} worst ${slow.worst} | down holds ${down.miss}/${down.n} worst ${down.worst} | up holds ${up.miss}/${up.n} worst ${up.worst} | flick up holds ${flick.miss}/${flick.n} worst ${flick.worst} | peak decoded ${flick.peak} frames | strip fetched ${Math.round(boxBytes / 1024)}KB in ${boxReq} requests`);
  await c.close();
}
await b.close();
