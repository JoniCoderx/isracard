import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [w, h, tag] of [[1440, 900, "desk"], [390, 844, "phone"]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  await p.goto("http://127.0.0.1:8777/", { waitUntil: "networkidle" });
  await p.waitForTimeout(2200); await p.click("#enterBtn", { timeout: 6000 }).catch(() => {});
  await p.waitForTimeout(700);
  const y = await p.evaluate(() => { const e = document.querySelector(".excep"); return e ? Math.round(e.getBoundingClientRect().top + scrollY - 60) : 0; });
  for (let v = 0; v < y; v += 400) { await p.evaluate(t => scrollTo({top:t,behavior:"instant"}), v); await p.waitForTimeout(45); }
  await p.evaluate(t => scrollTo({top:t,behavior:"instant"}), y); await p.waitForTimeout(1100);
  await p.screenshot({ path: `/tmp/exc-${tag}.png` });
  await p.close();
}
await b.close(); console.log("shot");
