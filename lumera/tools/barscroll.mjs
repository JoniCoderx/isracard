// The iPhone address bar, simulated: scroll down through the page while the
// window's height flips between 844 and 764 every few steps, as it does when
// the bar slides away and back. Times every step and counts canvas reallocations.
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [label, base] of [["before", "http://localhost:8777/"], ["after", "http://localhost:8779/"]]) {
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const p = await c.newPage(); const cdp = await c.newCDPSession(p); await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await p.goto(base, { waitUntil: "load" }); await p.waitForTimeout(2500); await p.click("#enterBtn", { timeout: 1500 }).catch(() => {});
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.__realloc = 0;
    const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "width"); Object.defineProperty(HTMLCanvasElement.prototype, "width", { set(v) { window.__realloc++; d.set.call(this, v); }, get() { return d.get.call(this); } }); });
  const top = await p.evaluate(() => document.getElementById("inside").getBoundingClientRect().top + scrollY - 200);
  const H = await p.evaluate(() => document.getElementById("collection").getBoundingClientRect().top + scrollY);
  let y = top, i = 0; const times = [];
  while (y < H) { y += 40; i++;
    if (i % 4 === 0) await p.setViewportSize({ width: 390, height: (i / 4) % 2 ? 764 : 844 });
    const t = await p.evaluate(async y => { const t0 = performance.now(); scrollTo(0, y); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return performance.now() - t0; }, y);
    times.push(t); }
  times.sort((a, b) => a - b);
  const re = await p.evaluate(() => window.__realloc);
  console.log(`${label}: ${times.length} steps, median ${times[times.length >> 1].toFixed(0)}ms, p90 ${times[Math.floor(times.length * 0.9)].toFixed(0)}ms, worst ${times[times.length - 1].toFixed(0)}ms, canvas reallocations ${re}`);
  await c.close();
}
await b.close();
