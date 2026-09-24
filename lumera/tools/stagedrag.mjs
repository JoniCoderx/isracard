import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600); await p.click("#enterBtn").catch(()=>{});
await p.waitForTimeout(900);
await p.evaluate(async () => { const s = Math.round(innerHeight*0.7); for (let y=0;y<document.body.scrollHeight;y+=s){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,80));} });
await p.evaluate(() => { const e=document.getElementById("stripwrap"); e.classList.add("wrist"); e.scrollIntoView({block:"center",behavior:"instant"}); });
await p.waitForTimeout(3000);
await p.evaluate(() => window.__bracelet.stage(true));
await p.waitForTimeout(4000);
await p.screenshot({ path: `${OUT}/sd-before.png` });
async function swipe(x, y, dx, dy) {
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
  for (let i = 1; i <= 14; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + dx*i/14, y: y + dy*i/14, id: 1 }] }); await new Promise(r => setTimeout(r, 22)); }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}
await swipe(195, 420, -150, 60);
await p.waitForTimeout(6000);
await p.screenshot({ path: `${OUT}/sd-after.png` });
console.log(await p.evaluate(() => { const c = document.getElementById("bcv"); return "canvas " + c.width + "x" + c.height + " staged=" + !!document.querySelector(".bstage.open"); }));
await b.close();
