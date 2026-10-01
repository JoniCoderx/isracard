import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]});
for (const [dv,w,h,mob] of [["d",1440,900,false],["m",390,844,true]]) {
const p=await (await b.newContext({viewport:{width:w,height:h},isMobile:mob,hasTouch:mob})).newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(800);
await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; const e=document.getElementById("stripwrap"); scrollTo(0,e.getBoundingClientRect().top+scrollY-(innerWidth>900?90:70));}); await p.waitForTimeout(1500);
await p.evaluate(()=>document.querySelector('.chip[data-k="metal"][data-v="yellow"]').click());
await p.evaluate(()=>{const t=[...document.querySelectorAll("#stripwrap .vtb")].find(b=>/wrist/i.test(b.textContent)); t.click();}); await p.waitForTimeout(3000);
await p.screenshot({path:O+`wrist-${dv}-1.jpg`,type:"jpeg",quality:65});
const hb=await p.evaluate(()=>{const s=document.getElementById("stripwrap").getBoundingClientRect(), h=document.querySelector(".handbar").getBoundingClientRect(); return {stripBottom:Math.round(s.bottom), barTop:Math.round(h.top), barX:Math.round(h.left+h.width/2), stripX:Math.round(s.left+s.width/2), barVisible:h.height>0};});
console.log(dv,"handbar",JSON.stringify(hb));
const r=await p.$eval("#stripwrap",e=>{const b=e.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}});
if (mob) await p.touchscreen.tap(r.x,r.y); else await p.mouse.click(r.x,r.y);
await p.waitForTimeout(2500);
console.log(dv,"zoom",JSON.stringify(await p.evaluate(()=>window.__wristZoom())), errs.join("|")||"clean");
await p.screenshot({path:O+`wrist-${dv}-2zoom.jpg`,type:"jpeg",quality:65});
await p.close(); }
await b.close();
