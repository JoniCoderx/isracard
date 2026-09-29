import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "networkidle" });
await p.waitForTimeout(2200); await p.click("#enterBtn", { timeout: 6000 }).catch(()=>{});
await p.waitForTimeout(600);
const y = await p.evaluate(()=>Math.round(document.querySelector(".pgrid").getBoundingClientRect().top+scrollY-110));
for (let v=0; v<y; v+=380){ await p.evaluate(t=>scrollTo({top:t,behavior:"instant"}),v); await p.waitForTimeout(45);}
await p.evaluate(t=>scrollTo({top:t,behavior:"instant"}),y); await p.waitForTimeout(1400);
await p.screenshot({ path:"/tmp/ring-grid.png" });
await b.close(); console.log("shot");
