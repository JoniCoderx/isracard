import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
const ctx = await b.newContext({ viewport:{width:1440,height:900} }); await ctx.addInitScript(() => { localStorage.setItem("silavu-seen","1"); });
const p = await ctx.newPage(); await p.goto("http://127.0.0.1:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(800);
const op = () => p.evaluate(() => +getComputedStyle(document.getElementById("where")).opacity);
await p.mouse.wheel(0,600); await p.waitForTimeout(300); const a = await op();
await p.waitForTimeout(2500); const c = await op();
console.log("while scrolling", a, "at rest", c, a>0.5 && c<0.05 ? "PASS" : "FAIL"); await b.close();
