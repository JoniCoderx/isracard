import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600); await p.click("#enterBtn").catch(()=>{});
await p.waitForTimeout(900);
await p.evaluate(async () => { const s = Math.round(innerHeight*0.7); for (let y=0;y<document.body.scrollHeight;y+=s){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,80));} });
const base = await p.evaluate(() => document.getElementById("configure").getBoundingClientRect().top + scrollY - 40);
for (const [n, d] of [["a", 0], ["b", 340], ["c", 700]]) {
  await p.evaluate(y => scrollTo({ top: y, behavior: "instant" }), base + d);
  await p.waitForTimeout(1100);
  await p.screenshot({ path: `${OUT}/build-${n}.png` });
}
console.log("shot");
await b.close();
