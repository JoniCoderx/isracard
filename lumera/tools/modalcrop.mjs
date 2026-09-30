import { chromium } from "playwright-core";
const OUT="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
for (const [w,h] of [[1440,900],[1024,768],[820,1180],[390,844]]) {
  const ctx = await b.newContext({ viewport:{width:w,height:h} });
  await ctx.addInitScript(() => { localStorage.setItem("silavu-seen","1"); });
  const p = await ctx.newPage(); await p.goto("http://127.0.0.1:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn").catch(()=>{});
  await p.evaluate(() => document.querySelectorAll(".pgrid .piece:not(.soon) .lnk.vw")[1].click()); await p.waitForTimeout(1200);
  console.log(w, JSON.stringify(await p.evaluate(() => { const i=document.getElementById("pmImg"), r=i.getBoundingClientRect(), s=getComputedStyle(i); return { box:[Math.round(r.width),Math.round(r.height)], nat:[i.naturalWidth,i.naturalHeight], fit:s.objectFit }; })));
  await p.screenshot({ path: OUT+"modal-"+w+".png" }); await ctx.close();
}
await b.close();
