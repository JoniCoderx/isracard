import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/", tag=process.argv[2]||"x", cut=process.argv[3]||"round";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(800);
await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; const e=document.getElementById("stripwrap"); scrollTo(0,e.getBoundingClientRect().top+scrollY-90);}); await p.waitForTimeout(2500);
await p.evaluate(c=>document.querySelector(`.chip[data-k="cut"][data-v="${c}"]`).click(), cut); await p.waitForTimeout(1500);
const bx=await p.$eval("#bcv",e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}});
for (const m of ["white","yellow","rose","platinum"]) {
  await p.evaluate(m=>document.querySelector(`.chip[data-k="metal"][data-v="${m}"]`).click(), m); await p.waitForTimeout(2200);
  await p.screenshot({path:O+`metal-${tag}-${m}.png`,clip:{x:bx.x+bx.w*0.22,y:bx.y+bx.h*0.55,width:bx.w*0.56,height:bx.h*0.36}});
}
await b.close();
