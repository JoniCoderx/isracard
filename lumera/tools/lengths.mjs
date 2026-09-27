/* Where the page's length actually is, chapter by chapter, in screens. */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const [tag, w, h, mob] of [["desk", 1440, 900, false], ["mob", 390, 844, true]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, deviceScaleFactor: 1 });
  await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2600); await p.click("#enterBtn").catch(() => {});
  await p.waitForTimeout(900);
  await p.evaluate(async () => { const s = Math.round(innerHeight * 0.7); for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 90)); } scrollTo({ top: 0, behavior: "instant" }); });
  await p.waitForTimeout(1600);
  const r = await p.evaluate(() => {
    const secs = [...document.querySelectorAll("main > section")].map(s => ({ id: s.id, px: s.offsetHeight, screens: +(s.offsetHeight / innerHeight).toFixed(2) }));
    return { total: +(document.body.scrollHeight / innerHeight).toFixed(2), vh: innerHeight, secs };
  });
  console.log(`\n${tag}  ${r.total} screens total`);
  r.secs.sort((a, bb) => bb.px - a.px);
  for (const s of r.secs) console.log("   " + String(s.id).padEnd(12) + String(s.screens).padStart(6) + " screens   " + String(s.px).padStart(6) + " px");
  await p.close();
}
await b.close();
