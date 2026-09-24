/* The occlusion is baked in JavaScript when the hand is built. That is once
   per build, but it is on the main thread, so it must not be a stall. */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const [n, w, mob] of [["desk", 1440, false], ["mob", 390, true]]) {
  const p = await b.newPage({ viewport: { width: w, height: 844 }, isMobile: mob, hasTouch: mob, deviceScaleFactor: 2 });
  await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2400); await p.click("#enterBtn").catch(() => {});
  await p.waitForTimeout(700);
  await p.evaluate(async () => { const s = Math.round(innerHeight*0.8); for (let y=0;y<document.body.scrollHeight;y+=s){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,70));} });
  await p.evaluate(() => { const e=document.getElementById("stripwrap"); e.scrollIntoView({block:"center",behavior:"instant"}); e.classList.add("wrist"); });
  await p.waitForTimeout(2500);
  const t = await p.evaluate(() => {
    const out = [];
    for (const k of ["m", "f", "m", "f"]) {
      const t0 = performance.now();
      window.__hand({ kind: k });
      out.push(+(performance.now() - t0).toFixed(1));
    }
    return out;
  });
  console.log(n + " buildHand ms: " + t.join(", "));
  await p.close();
}
await b.close();
