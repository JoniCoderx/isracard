// Memory and frame times over repeated scrolling: the whole page down and back
// up three times on an emulated phone (CPU 4x slower), old build vs new,
// with real-weight box frames. JS heap and the browser's own frame timing.
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--enable-precise-memory-info"] });
for (const [tag, port] of [["before", 8792], ["after", 8791]]) {
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); const p = await c.newPage(); const cdp = await c.newCDPSession(p);
  await cdp.send("Performance.enable"); await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await p.goto(`http://localhost:${port}/`, { waitUntil: "load" }); await p.waitForTimeout(800); await p.evaluate(() => document.getElementById("enterBtn").click());
  await p.waitForFunction(() => !document.documentElement.classList.contains("locked"), null, { timeout: 30000 }).catch(() => {});
  const r = await p.evaluate(() => new Promise(res => { document.documentElement.style.scrollBehavior = "auto"; const H = document.documentElement.scrollHeight - innerHeight;
    let dir = 1, laps = 0, y = 0, last = 0, frames = 0, long = 0; const heap = [];
    function f(t) { if (last) { const dt = t - last; frames++; if (dt > 34) long++; } last = t; y += dir * 2200 * 16.7 / 1000; if (y >= H) { y = H; dir = -1; } if (y <= 0 && dir < 0) { y = 0; dir = 1; laps++; if (performance.memory) heap.push(Math.round(performance.memory.usedJSHeapSize / 1048576)); }
      scrollTo(0, y); if (laps >= 3) return res({ frames, long, heap, held: window.__box ? window.__box.peak : -1 }); requestAnimationFrame(f); }
    requestAnimationFrame(f); }));
  const m = await cdp.send("Performance.getMetrics"); const g = k => (m.metrics.find(x => x.name === k) || {}).value;
  console.log(`${tag}: 3 laps, ${r.frames} frames, ${r.long} over 34ms (${(r.long / r.frames * 100).toFixed(1)}%), JS heap after each lap ${r.heap.join(" / ")} MB, box frames decoded at peak ${r.held}, layouts ${g("LayoutCount")}, script ${(g("ScriptDuration")).toFixed(2)}s`);
  await c.close();
}
await b.close();
