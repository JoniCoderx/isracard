/* Scrolling past the builder. The canvas is sticky, so it is on screen for
   the whole chapter — and if it is drifting it redraws every frame of that,
   with the heaviest shader on the page. */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600); await p.click("#enterBtn").catch(() => {});
await p.waitForTimeout(900);
await p.evaluate(async () => { const s = Math.round(innerHeight * 0.7); for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 90)); } });
for (const view of ["line", "wrist"]) {
  await p.evaluate(v => { const e = document.getElementById("stripwrap"); e.classList.toggle("wrist", v === "wrist"); }, view);
  const top = await p.evaluate(() => { const e = document.getElementById("build"); return e.getBoundingClientRect().top + scrollY; });
  await p.evaluate(y => scrollTo({ top: y, behavior: "instant" }), top);
  await p.waitForTimeout(2600);
  const r = await p.evaluate(async (t0) => {
    const frames = []; let last = performance.now(), stop = false;
    (function step() { const n = performance.now(); frames.push(n - last); last = n; if (!stop) requestAnimationFrame(step); })();
    /* scroll the way a thumb does: many small steps over two seconds */
    for (let i = 0; i < 60; i++) { scrollTo({ top: t0 + i * 26, behavior: "instant" }); await new Promise(r => requestAnimationFrame(r)); }
    stop = true;
    const f = frames.slice(4).sort((a, b) => a - b);
    return { n: f.length, median: +f[Math.floor(f.length / 2)].toFixed(1), p90: +f[Math.floor(f.length * 0.9)].toFixed(1), worst: +f[f.length - 1].toFixed(1) };
  }, top);
  console.log(view + " scrolling past the builder — frame ms: median " + r.median + ", p90 " + r.p90 + ", worst " + r.worst);
}
await b.close();
