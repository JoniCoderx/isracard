import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
for (const [w,h] of [[1440,900],[390,844]]) {
  const p=await (await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1})).newPage();
  await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn",{timeout:2000}).catch(()=>{});
  for (const sel of ["#macro",".soonh"]) {
    await p.evaluate(s=>{document.documentElement.style.scrollBehavior="auto"; const e=document.querySelector(s); scrollTo(0,e.getBoundingClientRect().top+scrollY-(s==="#macro"?60:80));},sel); await p.waitForTimeout(1600);
    await p.screenshot({path:O+`mac-${w}-${sel.replace(/\W/g,"")}.jpg`,type:"jpeg",quality:60});
  }
}
await b.close();
