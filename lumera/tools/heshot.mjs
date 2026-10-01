import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]});
for (const [w,h] of [[1440,900],[360,780]]) {
  const p=await (await b.newContext({viewport:{width:w,height:h},hasTouch:w<900})).newPage(); await p.route(/fonts\./,r=>r.abort());
  await p.goto("http://localhost:8777/he/",{waitUntil:"load"}); await p.waitForTimeout(2500); await p.click("#enterBtn",{timeout:3000}).catch(()=>{}); await p.waitForTimeout(1500);
  await p.screenshot({path:O+`he-hero-${w}.jpg`,type:"jpeg",quality:60});
  for (const id of ["bespoke","build"]) { await p.evaluate(id=>{document.documentElement.style.scrollBehavior="auto"; const e=document.getElementById(id)||document.querySelector("."+id); e&&scrollTo(0,e.getBoundingClientRect().top+scrollY+ (id==="bespoke"?40:0));},id); await p.waitForTimeout(2500);
    await p.screenshot({path:O+`he-${id}-${w}.jpg`,type:"jpeg",quality:60}); }
  const ov=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth); console.log(w,"overflow",ov);
}
await b.close();
