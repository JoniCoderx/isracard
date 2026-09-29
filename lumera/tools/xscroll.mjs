import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "networkidle" });
const t = await p.evaluate(() => document.documentElement.scrollHeight);
let worst = 0, at = 0;
for (let v = 0; v < t - 800; v += 200) {
  await p.evaluate(x => scrollTo({top:x,behavior:"instant"}), v); await p.waitForTimeout(60);
  const x = await p.evaluate(() => { scrollTo({ left: 999, top: scrollY, behavior: "instant" }); const s = scrollX; scrollTo({ left: 0, top: scrollY, behavior: "instant" }); return s; });
  if (x > worst) { worst = x; at = v; }
}
console.log("max sideways scroll:", worst, "at y =", at);
// also check wframe overflow style
await p.evaluate(x=>scrollTo({top:x,behavior:"instant"}), at);
console.log(await p.evaluate(() => { const w = document.getElementById("wframe"); return w ? getComputedStyle(w).overflow + " | " + w.scrollWidth + "/" + w.clientWidth : "none"; }));
await b.close();
