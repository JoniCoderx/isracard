import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "networkidle" });
await p.waitForTimeout(2400); await p.click("#enterBtn", { timeout: 6000 }).catch(() => {});
await p.waitForTimeout(900);
for (const [y, tag] of [[4400, "cream"], [7200, "dark"]]) {
  await p.evaluate(v => scrollTo({ top: v, behavior: "instant" }), y);
  await p.waitForTimeout(900);
  await p.screenshot({ path: `/tmp/bar-${tag}.png` });
}
await b.close(); console.log("shot");
