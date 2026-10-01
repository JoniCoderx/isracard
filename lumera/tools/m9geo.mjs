import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/", tag=process.argv[2]||"x", cuts=(process.argv[3]||"round,emerald").split(",");
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(800);
await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; const e=document.getElementById("stripwrap"); scrollTo(0,e.getBoundingClientRect().top+scrollY-90);}); await p.waitForTimeout(2000);
const bx=await p.$eval("#bcv",e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}});
for (const c of cuts) {
  await p.evaluate(c=>document.querySelector(`.chip[data-k="cut"][data-v="${c}"]`).click(), c); await p.waitForTimeout(1500);
  for (const v of ["front","side","under"]) {
    await p.evaluate(v=>document.querySelector(`[data-vpos="${v}"]`).click(), v); await p.waitForTimeout(1800);
    await p.screenshot({path:O+`geo-${tag}-${c}-${v}.png`,clip:{x:bx.x,y:bx.y,width:bx.w,height:bx.h}});
  }
  // close-up: wheel zoom on the front
  await p.evaluate(()=>document.querySelector('[data-vpos="front"]').click()); await p.waitForTimeout(800);
  await p.mouse.move(bx.x+bx.w/2,bx.y+bx.h*0.75); for (let i=0;i<8;i++){ await p.mouse.wheel(0,-240); await p.waitForTimeout(80);} await p.waitForTimeout(1800);
  await p.screenshot({path:O+`geo-${tag}-${c}-close.png`,clip:{x:bx.x,y:bx.y,width:bx.w,height:bx.h}});
  for (let i=0;i<8;i++){ await p.mouse.wheel(0,240); await p.waitForTimeout(60);} await p.waitForTimeout(600);
}
await b.close();
