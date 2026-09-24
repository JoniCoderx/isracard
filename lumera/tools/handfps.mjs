/* The skin shader got a great deal heavier. What does a frame cost now? */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const [n, w, h, mob] of [["desk", 1440, 900, false], ["mob", 390, 844, true]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, deviceScaleFactor: 2 });
  await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2400); await p.click("#enterBtn").catch(() => {});
  await p.waitForTimeout(700);
  await p.evaluate(async () => { const s = Math.round(innerHeight*0.8); for (let y=0;y<document.body.scrollHeight;y+=s){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,70));} });
  await p.evaluate(() => { const e=document.getElementById("stripwrap"); e.scrollIntoView({block:"center",behavior:"instant"}); e.classList.add("wrist"); });
  await p.waitForTimeout(3000);
  const r = await p.evaluate(() => new Promise(res => {
    const t = []; let last = performance.now(), n = 0;
    (function step() {
      const now = performance.now(); t.push(now - last); last = now;
      if (++n < 70) requestAnimationFrame(step);
      else { const s = t.slice(10).sort((a, b) => a - b); res({ median: +s[Math.floor(s.length/2)].toFixed(1), p90: +s[Math.floor(s.length*0.9)].toFixed(1) }); }
    })();
  }));
  console.log(n + " frame ms: median " + r.median + ", p90 " + r.p90 + "  (SwiftShader on CPU — a real GPU is far quicker)");
  await p.close();
}
await b.close();
