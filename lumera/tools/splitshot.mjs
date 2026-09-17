import { chromium } from "playwright-core";
const OUT="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
await p.waitForTimeout(3200); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
await p.waitForTimeout(900);
const clip = async (n) => { const el=await p.$("header.sh .mark"); const bx=el?await el.boundingBox():null;
  if(bx) await p.screenshot({path:`${OUT}/split-${n}.png`, clip:{x:Math.max(0,bx.x-26),y:Math.max(0,bx.y-22),width:bx.width+52,height:bx.height+44}}); };
await clip("rest");
console.log("rest filter: "+JSON.stringify(await p.evaluate(()=>document.querySelector("header.sh .mark .sy").style.filter||"(none)")));
// drive a hard scroll and freeze the handler mid-flight
await p.evaluate(()=>{ for(let i=0;i<10;i++) window.scrollBy(0,300); });
await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const f = await p.evaluate(()=>{ const s=document.querySelector("header.sh .mark .sy"); const v=s.style.filter; 
  // pin it so the screenshot catches the same state
  s.style.transition="none"; s.setAttribute("data-pin", v); return v; });
console.log("scrolling filter: "+JSON.stringify(f));
await clip("scroll");
console.log("split rendered: "+(f && f.indexOf("drop-shadow")>=0 && f.indexOf("blur")>=0 ? "YES" : "NO"));
await b.close();
