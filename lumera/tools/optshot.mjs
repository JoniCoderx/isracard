import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const [n, w] of [["390", 390], ["320", 320]]) {
  const p = await b.newPage({ viewport: { width: w, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2600); await p.click("#enterBtn").catch(() => {});
  await p.waitForTimeout(800);
  await p.evaluate(async () => { const s = Math.round(innerHeight * 0.8); for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 80)); } });
  await p.evaluate(() => document.getElementById("build").scrollIntoView({ block: "start", behavior: "instant" }));
  await p.waitForTimeout(1600);
  await p.screenshot({ path: `${OUT}/opts-${n}.png` });
  await p.evaluate(() => { const o = document.getElementById("opts"); o.scrollIntoView({ block: "center", behavior: "instant" }); });
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${OUT}/opts-${n}-b.png` });
  await p.close();
}
await b.close(); console.log("ok");
