import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
await ctx.addInitScript(() => { localStorage.setItem("silavu-seen","1"); });
const p = await ctx.newPage(); await p.goto("http://127.0.0.1:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(800);
const vis = () => p.evaluate(() => [...document.querySelectorAll(".rv")].filter(e=>{ const r=e.getBoundingClientRect(); return e.offsetParent && r.bottom>0 && r.top<innerHeight; }).map(e=>[(e.className).slice(0,20), +(+getComputedStyle(e).opacity).toFixed(2)]));
// fast wheel scroll
for (let i=0;i<30;i++){ await p.mouse.wheel(0,400); await p.waitForTimeout(30); }
await p.waitForTimeout(1500); console.log("after fast wheel", JSON.stringify(await vis()));
await p.evaluate(()=>document.querySelector('a[href="#collection"]').click()); await p.waitForTimeout(2500);
console.log("after nav to collection", JSON.stringify(await vis()));
for (let y=0;y<20000;y+=700){ await p.evaluate(y=>scrollTo(0,y),y); await p.waitForTimeout(80); }
await p.evaluate(()=>document.getElementById("collection").scrollIntoView()); await p.waitForTimeout(1500);
console.log("jump back to collection", JSON.stringify(await vis()));
await b.close();
