import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/col/";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
for (const [w,h,lang] of [[1440,900,"en"],[390,844,"en"],[390,844,"he"],[820,1180,"en"]]) {
  const p = await b.newPage({ viewport:{width:w,height:h} });
  await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" }); await p.waitForTimeout(1500); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(500);
  if (lang==="he") { await p.click("#langBtn"); await p.click('[data-lang="he"]').catch(()=>{}); await p.waitForTimeout(700); }
  await p.evaluate(() => { const e=document.querySelector(".pgrid .soonh"); scrollTo(0, scrollY+e.getBoundingClientRect().top-(innerHeight*0.45)); }); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}soon-${w}-${lang}.png` });
  await p.close();
}
await b.close();
