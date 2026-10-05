// node shotpage.mjs <url> <out-prefix> [full]  — desktop 1440 and phone 390 screenshots
import { chromium } from "playwright-core";
const [u, out, full] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
for (const [w, h, mob, tag] of [[1440, 900, false, "desk"], [390, 844, true, "phone"]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, deviceScaleFactor: mob ? 2 : 1 }); const p = await c.newPage();
  await p.goto(u, { waitUntil: "load" }); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}-${tag}.jpg`, type: "jpeg", quality: 62, fullPage: !!full });
  await c.close();
}
await b.close();
