/* The desktop page, one screen at a time. */
import { chromium } from "playwright-core";
import { mkdirSync, rmSync } from "node:fs";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/dwalk";
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2800); await p.click("#enterBtn").catch(() => {});
await p.waitForTimeout(1200);
await p.evaluate(async () => { const s = Math.round(innerHeight * 0.6); for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 170)); } scrollTo({ top: 0, behavior: "instant" }); });
await p.waitForTimeout(2200);
const H = await p.evaluate(() => document.body.scrollHeight);
let i = 0;
for (let y = 0; y < H - 250; y += 900) {
  await p.evaluate(v => scrollTo({ top: v, behavior: "instant" }), y);
  await p.waitForTimeout(950);
  await p.screenshot({ path: `${OUT}/d${String(i).padStart(2, "0")}.png` });
  i++;
}
console.log("screens:", i, "page:", (H / 900).toFixed(2), "viewports");
await b.close();
