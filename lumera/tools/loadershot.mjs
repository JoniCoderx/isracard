import { chromium } from "playwright-core";
const OUT="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [n,w,h,mob] of [["L",1440,900,false],["Lm",390,844,true]]) {
  const p = await b.newPage({ viewport:{width:w,height:h}, isMobile:mob, hasTouch:mob });
  // hold the intro open: drop the long timers that would hand off, and the skip listeners
  await p.addInitScript(()=>{ const st=window.setTimeout; window.setTimeout=function(f,d){ if(d>=250) return 0; return st.apply(window,arguments); }; });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html?intro=1",{waitUntil:"load"});
  await p.waitForTimeout(300);
  for (const pct of [12,35,60,85,100]) {
    const got = await p.evaluate(async(target)=>{
      const q=document.querySelector(".imk .iqin"); if(!q) return "no riser";
      const anims=[...document.querySelectorAll(".imk .iqin,.imk .isin")].flatMap(e=>e.getAnimations());
      if(!anims.length) return "no anim";
      for(let i=0;i<600;i++){ const t=anims[0].currentTime||0; if(t/1450*100>=target){ anims.forEach(a=>a.pause()); return Math.round(t/1450*100)+"%"; } await new Promise(r=>requestAnimationFrame(r)); }
      anims.forEach(a=>a.pause()); return "timeout at "+Math.round((anims[0].currentTime||0)/1450*100)+"%";
    }, pct);
    const el=await p.$(".imk"); const bx=el?await el.boundingBox():null;
    if(bx&&bx.width>2) await p.screenshot({path:`${OUT}/${n}-p${pct}.png`, clip:{x:Math.max(0,bx.x-24),y:Math.max(0,bx.y-24),width:bx.width+48,height:bx.height+48}});
    console.log(n+" target "+pct+"% -> "+got);
    await p.evaluate(()=>{ [...document.querySelectorAll(".imk .iqin,.imk .isin")].flatMap(e=>e.getAnimations()).forEach(a=>a.play()); });
  }
  await p.close();
}
await b.close();
