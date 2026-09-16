import { chromium } from "playwright-core";
const OUT="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [n,w,h,mob] of [["wide",1887,861,false],["mob",390,844,true]]) {
  const p = await b.newPage({ viewport:{width:w,height:h}, isMobile:mob, hasTouch:mob });
  const errs=[]; p.on("pageerror",e=>errs.push(String(e).slice(0,150)));
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
  await p.waitForTimeout(3000); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
  await p.evaluate(()=>{ const e=document.getElementById("build"); window.scrollTo({top:scrollY+e.getBoundingClientRect().top,behavior:"instant"}); });
  await p.waitForTimeout(900);
  await p.evaluate(()=>{ const t=[...document.querySelectorAll("#build a,#build button")].find(e=>/START DESIGNING/i.test(e.textContent)); t&&t.click(); });
  await p.waitForTimeout(6000);
  console.log("\n=== "+n+" "+w+"x"+h+" ===");
  const clicked = await p.evaluate(()=>{ const t=document.querySelector('[data-toy="carry"]'); if(!t) return "NO BUTTON"; const r=t.getBoundingClientRect(); const top=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2); t.click(); return "clicked; covered-by="+(top? top.tagName+"#"+(top.id||"")+"."+(top.className||"").toString().split(" ")[0] : "none"); });
  console.log("carry: "+clicked);
  await p.waitForTimeout(2500);
  console.log(await p.evaluate(()=>{
    const cv=document.getElementById("bcv"), g=document.getElementById("bgrab"), pb=document.getElementById("playbar");
    const c=cv?getComputedStyle(cv):null, r=cv?cv.getBoundingClientRect():null;
    const gr=g?g.getBoundingClientRect():null, gc=g?getComputedStyle(g):null;
    const pr=pb?pb.getBoundingClientRect():null, pc=pb?getComputedStyle(pb):null;
    return "play="+document.documentElement.classList.contains("silavu-play")
      +"\ncanvas pos="+(c?c.position:"-")+" z="+(c?c.zIndex:"-")+" rect="+(r?Math.round(r.left)+","+Math.round(r.top)+" "+Math.round(r.width)+"x"+Math.round(r.height):"-")+" pe="+(c?c.pointerEvents:"-")
      +"\nbgrab="+(g?("disp="+gc.display+" rect="+Math.round(gr.left)+","+Math.round(gr.top)+" "+Math.round(gr.width)+"x"+Math.round(gr.height)):"MISSING")
      +"\nplaybar="+(pb?("disp="+pc.display+" rect="+Math.round(pr.left)+","+Math.round(pr.top)+" "+Math.round(pr.width)+"x"+Math.round(pr.height)+" z="+pc.zIndex):"MISSING");
  }));
  await p.screenshot({path:OUT+"/carry-"+n+"-1.png"});
  // can we still scroll?
  const y0 = await p.evaluate(()=>scrollY);
  await p.evaluate(()=>window.scrollBy(0, 1400));
  await p.waitForTimeout(1200);
  const y1 = await p.evaluate(()=>scrollY);
  console.log("scroll while carrying: "+y0+" -> "+y1+(y1>y0?" OK":" BLOCKED"));
  await p.screenshot({path:OUT+"/carry-"+n+"-2.png"});
  console.log("errors="+errs.length+(errs.length?" :: "+errs[0]:""));
  await p.close();
}
await b.close();
