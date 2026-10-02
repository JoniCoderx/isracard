import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
const tag=process.argv[2]||"a";
for (const [w,h,path] of [[390,844,""],[390,844,"he/"],[1440,900,""]]) {
  const p=await (await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1})).newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("http://localhost:8777/"+path,{waitUntil:"load"}); await p.waitForTimeout(800);
  await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; scrollTo(0,document.body.scrollHeight);}); await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>{const e=document.getElementById("end"); e.querySelectorAll(".rv").forEach(x=>x.classList.add("in")); const b=e.getBoundingClientRect(); return {h:Math.round(e.offsetHeight), top:Math.round(b.top+scrollY)};});
  await p.setViewportSize({width:w,height:Math.max(h,r.h+40)}); await p.evaluate(t=>scrollTo(0,t-20),r.top); await p.waitForTimeout(700);
  await p.screenshot({path:O+`foot-${tag}-${w}${path?"-he":""}.png`});
  console.log(w,path,"footer height",r.h, errs.join("|")||"ok");
}
await b.close();
