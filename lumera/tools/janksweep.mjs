/* Where does the phone actually stutter? Scroll the whole page in thumb-sized
   steps and attribute every frame to the chapter that was on screen for it. */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600); await p.click("#enterBtn").catch(() => {});
await p.waitForTimeout(900);
await p.evaluate(async () => { const s = Math.round(innerHeight * 0.7); for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 90)); } scrollTo({ top: 0, behavior: "instant" }); });
await p.waitForTimeout(2200);
const r = await p.evaluate(async () => {
  const secs = [...document.querySelectorAll("main > section")].map(s => ({ id: s.id, top: s.offsetTop, bot: s.offsetTop + s.offsetHeight, f: [] }));
  const here = y => { const m = y + innerHeight * 0.5; return secs.find(s => m >= s.top && m < s.bot) || secs[secs.length - 1]; };
  let last = performance.now();
  for (let y = 0; y < document.body.scrollHeight - innerHeight; y += 34) {
    scrollTo({ top: y, behavior: "instant" });
    await new Promise(r => requestAnimationFrame(r));
    const n = performance.now(); const s = here(y); if (s) s.f.push(n - last); last = n;
  }
  return secs.filter(s => s.f.length > 4).map(s => {
    const f = s.f.slice().sort((a, b) => a - b);
    return { id: s.id, n: f.length, median: +f[Math.floor(f.length/2)].toFixed(1), p90: +f[Math.floor(f.length*0.9)].toFixed(1) };
  });
});
r.sort((a, b) => b.median - a.median);
for (const s of r) console.log(String(s.id).padEnd(12) + " median " + String(s.median).padStart(6) + " ms   p90 " + String(s.p90).padStart(6) + " ms   (" + s.n + " frames)");
await b.close();
