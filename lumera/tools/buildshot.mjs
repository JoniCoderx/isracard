/* The builder on a phone, in strips, so it can be looked at rather than
   guessed about. Shoots #configure from its top in screen-sized slices. */
import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const view = process.argv[2] || "line";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600); await p.click("#enterBtn").catch(()=>{});
await p.waitForTimeout(900);
await p.evaluate(async()=>{const s=Math.round(innerHeight*0.7);for(let y=0;y<document.body.scrollHeight;y+=s){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,120));}});
if (view === "wrist") { await p.evaluate(()=>window.__stripView("wrist")); await p.waitForTimeout(2500); }
const geo = await p.evaluate(()=>{const e=document.getElementById("configure");const b=e.getBoundingClientRect();return {top:Math.round(b.top+scrollY), h:Math.round(b.height)};});
console.log("configure", JSON.stringify(geo));
let n = 0;
for (let y = geo.top - 70; y < geo.top + geo.h; y += 700) {
  await p.evaluate(v=>scrollTo({top:v,behavior:"instant"}), y);
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${OUT}/bld-${view}-${n}.png` });
  n++;
}
console.log("slices", n);
await b.close();
