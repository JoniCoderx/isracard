import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
for (const [w,path] of [[1440,""],[1440,"privacy/"]]) {
  const p=await (await b.newContext({viewport:{width:w,height:900},deviceScaleFactor:1})).newPage();
  await p.goto("http://localhost:8777/"+path,{waitUntil:"load"}); await p.waitForTimeout(1000); await p.click("#enterBtn",{timeout:1500}).catch(()=>{});
  await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; scrollTo(0,document.body.scrollHeight); document.querySelectorAll(".rv").forEach(x=>x.classList.add("in"));}); await p.waitForTimeout(1500);
  const el=await p.$(path?"footer, .dfoot, .dfbot":"#end"); await el.screenshot({path:O+`fe-${path?"doc":"home"}.jpg`,type:"jpeg",quality:65});
}
await b.close();
