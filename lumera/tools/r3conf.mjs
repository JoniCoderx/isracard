import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/r3/";
const tag=process.argv[2]||"now";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--disable-background-networking","--disable-component-update","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]});
for (const [dv,w,h] of [["d",1440,900],["m",390,844]]) {
  const p=await (await b.newContext({viewport:{width:w,height:h},hasTouch:w<900})).newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn",{timeout:3000}).catch(()=>{}); await p.waitForTimeout(800);
  await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; const e=document.getElementById("configure"); scrollTo(0,e.getBoundingClientRect().top+scrollY-80);}); await p.waitForTimeout(6000);
  const hgt=await p.evaluate(()=>{const b=document.getElementById("build"); return {section:b.offsetHeight, panel:document.getElementById("configure").offsetHeight, no3d:document.documentElement.classList.contains("no3d")};});
  console.log(dv,JSON.stringify(hgt),errs.join("|"));
  await p.screenshot({path:O+`conf-${tag}-${dv}.jpg`,type:"jpeg",quality:70});
  const el=await p.$("#configure"); await el.screenshot({path:O+`conf-${tag}-${dv}-full.jpg`,type:"jpeg",quality:60});
  await p.close();
}
await b.close();
