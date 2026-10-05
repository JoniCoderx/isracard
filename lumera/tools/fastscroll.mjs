/* A fast thumb fling down the whole page on a phone (4x slower CPU): frame
   times per chapter, long frames, and the JavaScript that ate the time. */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
const c = await p.context().newCDPSession(p);
await p.goto("http://127.0.0.1:8777/" + (process.argv[2] || ""), { waitUntil: "load" });
await p.waitForFunction(() => !document.documentElement.classList.contains("locked"), null, { timeout: 25000 }).catch(() => {});
await p.waitForTimeout(1500);
await c.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await c.send("Profiler.enable"); await c.send("Profiler.setSamplingInterval", { interval: 200 }); await c.send("Profiler.start");
const r = await p.evaluate(async () => {
  const secs = [...document.querySelectorAll("main > section, body > section, section[id]")].filter(s => s.offsetHeight > 200).map(s => ({ id: s.id, top: s.getBoundingClientRect().top + scrollY, bot: s.getBoundingClientRect().bottom + scrollY, f: [] }));
  const here = y => { const m = y + innerHeight * 0.5; return secs.find(s => m >= s.top && m < s.bot); };
  let last = performance.now(); const H = document.documentElement.scrollHeight - innerHeight;
  for (let y = 0; y < H; y += 140) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => requestAnimationFrame(r)); const n = performance.now(); const s = here(y); if (s) s.f.push(n - last); last = n; }
  return secs.filter(s => s.f.length > 2).map(s => { const f = s.f.sort((a, b) => a - b); return s.id + ": n=" + f.length + " med " + f[f.length >> 1].toFixed(0) + "ms p90 " + f[Math.floor(f.length * .9)].toFixed(0) + " max " + f[f.length - 1].toFixed(0) + " >50ms " + f.filter(x => x > 50).length; });
});
const { profile } = await c.send("Profiler.stop");
console.log(r.join("\n"));
const self = new Map(), dt = profile.timeDeltas, byId = new Map(profile.nodes.map(n => [n.id, n]));
const parent = new Map(); profile.nodes.forEach(n => (n.children || []).forEach(ch => parent.set(ch, n.id)));
profile.samples.forEach((id, i) => { let n = byId.get(id), f = n.callFrame, nat = f.url ? "" : (f.functionName || "?");
  while (n && !n.callFrame.url && parent.has(n.id)) n = byId.get(parent.get(n.id));
  f = n.callFrame; const k = (f.url ? f.url.split("/").pop().slice(0, 18) + ":" + f.lineNumber + ":" + f.columnNumber + " " + (f.functionName || "anon") : "(" + (f.functionName || "?") + ")") + (nat && f.url ? " > " + nat : "");
  self.set(k, (self.get(k) || 0) + (dt[i] || 0)); });
const tot = [...self.values()].reduce((a, b) => a + b, 0);
console.log("--- top self time (ms of " + (tot / 1000).toFixed(0) + ")");
[...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18).forEach(([k, v]) => console.log((v / 1000).toFixed(0).padStart(6) + "  " + k));
await b.close();
