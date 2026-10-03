import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
const p=await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2})).newPage();
await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1000); await p.click("#enterBtn",{timeout:1500}).catch(()=>{});
let i=0; for (const sel of ["#collection","#craft","#end"]) { await p.evaluate(s=>{document.documentElement.style.scrollBehavior="auto"; const e=document.querySelector(s); scrollTo(0, s==="#end"?document.body.scrollHeight: e.getBoundingClientRect().top+scrollY+200);},sel); await p.waitForTimeout(1200);
  await p.screenshot({path:O+`hdr${i++}.png`, clip: sel==="#end"?{x:0,y:600,width:700,height:300}:{x:1000,y:0,width:440,height:80}}); }
console.log(await p.evaluate(()=>{const r=x=>{const b=document.querySelector(x).getBoundingClientRect(); return Math.round(b.height)}; return [r("#langBtn"), r(".hbook"), getComputedStyle(document.getElementById("where")).opacity];}));
await b.close();
