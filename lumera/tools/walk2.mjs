import { chromium } from "playwright-core";
import fs from "fs";
const OUT = process.argv[2] || "/tmp/walk2";
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = []; p.on("pageerror", e => errs.push(String(e)));
await p.goto("http://127.0.0.1:8777/", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
const total = await p.evaluate(() => document.documentElement.scrollHeight);
let n = 0, shot = 0;
for (let y = 0; y + 200 < total; y += 40) {
  await p.evaluate(v => scrollTo({ top: v, behavior: "instant" }), y);
  await p.waitForTimeout(45);
  if (y % 760 === 0) {
    await p.waitForTimeout(500);
    const where = await p.evaluate(() => { let best = "", bt = -1e9; document.querySelectorAll("section[id],div[id].chapter").forEach(s => { const t = s.getBoundingClientRect().top; if (t < innerHeight / 2 && t > bt) { bt = t; best = s.id; } }); return best; });
    await p.screenshot({ path: `${OUT}/${String(shot).padStart(2, "0")}-${where || "x"}.png` });
    shot++;
  }
  n++;
}
console.log("screens", shot, "total", total, "errors", errs.length); errs.slice(0,5).forEach(e=>console.log(e));
await b.close();
