import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [w, h, tag] of [[1440, 900, "desk"], [390, 844, "phone"]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  await p.goto("http://127.0.0.1:8777/", { waitUntil: "networkidle" });
  await p.waitForTimeout(2400); await p.click("#enterBtn", { timeout: 6000 }).catch(() => {});
  await p.waitForTimeout(1400);
  await p.screenshot({ path: `/tmp/hero-${tag}.png` });
  await p.close();
}
await b.close(); console.log("shot");
