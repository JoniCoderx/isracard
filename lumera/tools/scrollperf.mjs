// Phone scrolling, measured: the page is scrolled top to bottom and back in
// small steps on a 4x slowed CPU, and every frame is timed. Reports the long
// frames per section and where the main thread spends its time.
import { chromium } from "playwright-core";
const base = process.env.BASE || "http://localhost:8777/";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--enable-gpu-rasterization"] });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
const p = await c.newPage(); const cdp = await c.newCDPSession(p);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await p.goto(base + (process.env.PATH_ || ""), { waitUntil: "load" }); await p.waitForTimeout(2500); await p.click("#enterBtn", { timeout: 1500 }).catch(() => {});
await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
await cdp.send("Performance.enable");
const m0 = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map(m => [m.name, m.value]));
const res = await p.evaluate(async () => {
  const secs = [...document.querySelectorAll("main > section, body > section, section[id]")];
  const where = () => { const y = innerHeight / 2; const s = secs.find(s => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom > y; }); return s ? (s.id || s.className.split(" ")[0]) : "?"; };
  const H = document.documentElement.scrollHeight - innerHeight, frames = []; let last = performance.now();
  const step = 24; // px per frame, a steady thumb
  for (const dir of [1, -1]) {
    let y = dir > 0 ? 0 : H;
    while (dir > 0 ? y < H : y > 0) { y += dir * step; scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); const now = performance.now(); frames.push([now - last, where()]); last = now; }
  }
  const by = {}; for (const [d, s] of frames) { (by[s] ||= { n: 0, long: 0, worst: 0, sum: 0 }); const o = by[s]; o.n++; o.sum += d; if (d > 34) o.long++; o.worst = Math.max(o.worst, d); }
  return { n: frames.length, long: frames.filter(f => f[0] > 34).length, avg: frames.reduce((a, f) => a + f[0], 0) / frames.length, by };
});
const m1 = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map(m => [m.name, m.value]));
const d = k => (m1[k] - m0[k]);
console.log(`frames ${res.n}, long(>34ms) ${res.long}, avg ${res.avg.toFixed(1)}ms`);
for (const [s, o] of Object.entries(res.by)) console.log(`  ${s.padEnd(14)} frames ${String(o.n).padStart(4)}  avg ${(o.sum / o.n).toFixed(1).padStart(5)}ms  long ${String(o.long).padStart(3)}  worst ${o.worst.toFixed(0)}ms`);
console.log(`main thread: script ${d("ScriptDuration").toFixed(2)}s, layout ${d("LayoutDuration").toFixed(2)}s (${d("LayoutCount")} layouts), style ${d("RecalcStyleDuration").toFixed(2)}s (${d("RecalcStyleCount")}), task ${d("TaskDuration").toFixed(2)}s`);
await b.close();
