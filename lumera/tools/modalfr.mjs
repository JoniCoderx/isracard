import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
for (const lang of ["fr","ar"]) {
const ctx = await b.newContext({ viewport:{width:1280,height:800} });
await ctx.addInitScript(l => { localStorage.setItem("silavu-lang", l); localStorage.setItem("silavu-seen","1"); }, lang);
const p = await ctx.newPage(); await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" }); await p.waitForTimeout(1500); await p.click("#enterBtn").catch(()=>{});
await p.evaluate(() => document.querySelectorAll(".pgrid .piece:not(.soon) .lnk.vw")[1].click()); await p.waitForTimeout(800);
console.log(lang, (await p.evaluate(() => { const m=document.querySelector(".modal.open, [role=dialog][aria-hidden=false], #pm"); return m ? m.innerText : "no modal"; })).replace(/\n+/g," | ").slice(0,900));
await ctx.close(); }
await b.close();
