import { chromium } from "playwright-core";
const OUT="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
for (const [t,w,h,l] of [["d",1440,900,"he"],["m",390,844,"en"]]) {
  const ctx = await b.newContext({ viewport:{width:w,height:h} });
  await ctx.addInitScript(l => { localStorage.setItem("silavu-lang", l); localStorage.setItem("silavu-seen","1"); }, l);
  const p = await ctx.newPage(); await p.goto("http://127.0.0.1:8777/",{waitUntil:"load"}); await p.waitForTimeout(2500); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(2500);
  await p.screenshot({ path: OUT+"hero-"+t+".png" }); await ctx.close();
}
await b.close();
