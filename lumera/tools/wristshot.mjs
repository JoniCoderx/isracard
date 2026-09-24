import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2400); await p.click("#enterBtn").catch(()=>{});
await p.waitForTimeout(700);
await p.evaluate(async () => { const s = Math.round(innerHeight*0.8); for (let y=0;y<document.body.scrollHeight;y+=s){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,70));} });
await p.evaluate(() => document.getElementById("stripwrap").scrollIntoView({ block:"start", behavior:"instant" }));
await p.waitForTimeout(700);
/* tap "On a wrist" the way a thumb would */
const t = await p.$$(".vt .vtb");
if (t[1]) await t[1].click();
await p.waitForTimeout(3200);
await p.screenshot({ path: `${OUT}/wrist-mob.png` });
console.log("wrist on:", await p.evaluate(() => document.getElementById("stripwrap").classList.contains("wrist")));
console.log("handbar:", await p.evaluate(() => { const h=document.getElementById("handbar"); if(!h) return "missing"; const r=h.getBoundingClientRect(); const cs=getComputedStyle(h); return `${Math.round(r.width)}x${Math.round(r.height)} display=${cs.display} at y=${Math.round(r.top)}`; }));
await b.close();
