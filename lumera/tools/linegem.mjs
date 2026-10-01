import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
for (const [w,h,dpr] of [[1440,900,2],[390,844,2]]) {
  const p=await (await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:dpr})).newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn",{timeout:2000}).catch(()=>{});
  const r=await p.evaluate(()=>{const e=document.getElementById("drawpin"); return {top:e.getBoundingClientRect().top+scrollY, h:e.offsetHeight};});
  for (const f of [0.75,0.95]) {
    await p.evaluate(([t,hh,f])=>{document.documentElement.style.scrollBehavior="auto"; const lead=innerHeight*0.75, span=hh-innerHeight+lead; scrollTo(0,t+f*span-lead);},[r.top,r.h,f]); await p.waitForTimeout(900);
    await p.screenshot({path:O+`gem-${w}-${f}.png`, clip: w>900?{x:300,y:240,width:640,height:300}:{x:0,y:250,width:390,height:250}});
  }
  console.log(w, errs.join("|")||"ok");
}
await b.close();
