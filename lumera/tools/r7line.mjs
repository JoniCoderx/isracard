import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/r4/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--disable-background-networking"]});
for (const [dv,w,h] of [["d",1440,900],["m",390,844]]) {
const p=await (await b.newContext({viewport:{width:w,height:h},hasTouch:w<900})).newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn",{timeout:3000}).catch(()=>{}); await p.waitForTimeout(800);
for (const f of [0.1,0.3,0.55,0.7,0.95]) { await p.evaluate(f=>{document.documentElement.style.scrollBehavior="auto"; const e=document.getElementById("drawpin"); scrollTo(0,e.getBoundingClientRect().top+scrollY+(e.offsetHeight-innerHeight)*f);},f); await p.waitForTimeout(1100);
  await p.screenshot({path:O+`line-${dv}-${f}.jpg`,type:"jpeg",quality:72}); }
console.log(dv, errs.join("|")||"clean"); }
await b.close();
