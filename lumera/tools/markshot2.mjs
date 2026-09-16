import { chromium } from "playwright-core";
const OUT="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.addInitScript(()=>{ const st=window.setTimeout; window.setTimeout=function(f,d){ if(d>=300) return 0; return st.apply(window,arguments); }; });
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html?intro=1",{waitUntil:"load"});
await p.waitForTimeout(250);
for (const pct of [5,28,50,72,95]) {
  await p.evaluate(async(t)=>{
    const a=[...document.querySelectorAll(".imk .isin,.imk,.imk::before")].flatMap(e=>e.getAnimations());
    const ref=a.find(x=>x.animationName==="imk-ref")||a[0]; if(!ref) return;
    for(let i=0;i<900;i++){ const cur=(ref.currentTime||0)/1550*100; if(cur>=t){ a.forEach(x=>x.pause()); return; } await new Promise(r=>requestAnimationFrame(r)); }
    a.forEach(x=>x.pause());
  }, pct);
  const el=await p.$(".imk"); const bx=el?await el.boundingBox():null;
  if(bx&&bx.width>2) await p.screenshot({path:`${OUT}/mk-${pct}.png`, clip:{x:Math.max(0,bx.x-40),y:Math.max(0,bx.y-40),width:bx.width+80,height:bx.height+80}});
  console.log("captured "+pct+"%");
  await p.evaluate(()=>{ [...document.querySelectorAll(".imk .isin,.imk")].flatMap(e=>e.getAnimations()).forEach(x=>x.play()); });
}
await b.close();
