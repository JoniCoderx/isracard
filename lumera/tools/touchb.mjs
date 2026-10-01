import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]});
let pass=0,fail=0; const ok=(c,m)=>{c?pass++:fail++; console.log((c?"PASS ":"FAIL ")+m);};
for (const [w,h] of [[390,844],[360,780]]) {
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:true,deviceScaleFactor:2}); const p=await ctx.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.route(/fonts\./,r=>r.abort()); await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn",{timeout:3000}).catch(()=>{});
  await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; const e=document.getElementById("stripwrap"); scrollTo(0,e.getBoundingClientRect().top+scrollY-120);}); await p.waitForTimeout(2500);
  const box=await p.evaluate(()=>{const r=document.getElementById("bcv").getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2,ta:getComputedStyle(document.getElementById("bcv")).touchAction};});
  const y0=await p.evaluate(()=>scrollY); const shot0=await p.screenshot({clip:{x:0,y:120,width:w,height:300}});
  const cdp=await ctx.newCDPSession(p);
  const tp=(type,x,y)=>cdp.send("Input.dispatchTouchEvent",{type,touchPoints:type==="touchEnd"?[]:[{x,y}]});
  await tp("touchStart",box.x,box.y); for (let i=1;i<=12;i++){ await tp("touchMove",box.x+i*6,box.y-i*14); await p.waitForTimeout(16);} await tp("touchEnd");
  await p.waitForTimeout(600);
  const y1=await p.evaluate(()=>scrollY); const shot1=await p.screenshot({clip:{x:0,y:120,width:w,height:300}});
  const staged=await p.evaluate(()=>!!document.querySelector(".bstage.open"));
  ok(box.ta==="none" && Math.abs(y1-y0)<2 && !staged && !shot0.equals(shot1), `${w} vertical drag on the bracelet turns it, page stays (touch-action ${box.ta}, scroll ${y0}->${y1}, changed ${!shot0.equals(shot1)})`);
  await p.evaluate(()=>{const e=document.getElementById("enquire"); scrollTo(0,e.getBoundingClientRect().top+scrollY);}); await p.waitForTimeout(1800);
  const r=await p.evaluate(()=>{const m=document.getElementById("emb").getBoundingClientRect(), h=document.querySelector("#concierge .h2").getBoundingClientRect(), f=document.getElementById("cform").getBoundingClientRect(); return {mL:m.left,mR:m.right,mT:m.top,mB:m.bottom,hR:h.right,hT:h.top,fT:f.top,fW:f.width,ov:document.documentElement.scrollWidth-innerWidth};});
  ok(r.mL>r.hR-4 && r.mB<r.fT && r.ov<=0 && r.fW>w*0.8, `${w} mark sits right of the heading, form full width below (${JSON.stringify(r)})`);
  await p.screenshot({path:O+`enq-${w}.jpg`,type:"jpeg",quality:60});
  ok(errs.length===0, `${w} no errors ${errs.join("|")}`); await ctx.close();
}
await b.close(); console.log(pass,"pass,",fail,"fail");
