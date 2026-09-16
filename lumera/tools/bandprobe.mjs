import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.addInitScript(()=>{ const st=window.setTimeout; window.setTimeout=function(f,d){ if(d>=300) return 0; return st.apply(window,arguments); }; });
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html?intro=1",{waitUntil:"load"});
await p.waitForTimeout(400);
console.log(await p.evaluate(()=>{
  const el=document.querySelector(".imk .isin"); if(!el) return "no .isin";
  const cs=getComputedStyle(el), r=el.getBoundingClientRect(), pr=el.parentElement.getBoundingClientRect();
  const an=el.getAnimations().map(a=>a.animationName+" t="+Math.round(a.currentTime||0)+" state="+a.playState);
  return "rect="+Math.round(r.width)+"x"+Math.round(r.height)+" parent="+Math.round(pr.width)+"x"+Math.round(pr.height)
    +"\n opacity="+cs.opacity+" blend="+getComputedStyle(el.parentElement).mixBlendMode+" parentOpacity="+getComputedStyle(el.parentElement).opacity
    +"\n bgPos="+cs.backgroundPosition+" bgSize="+cs.backgroundSize
    +"\n anims=["+an.join(" | ")+"]";
}));
for (const t of [300,700,1100]) {
  await p.evaluate(ms=>{ const a=document.querySelector(".imk .isin"); if(!a) return; a.getAnimations().forEach(x=>{x.currentTime=ms; x.pause();}); }, t);
  await p.waitForTimeout(120);
  console.log("t="+t+" bgPos="+await p.evaluate(()=>getComputedStyle(document.querySelector(".imk .isin")).backgroundPosition)+" op="+await p.evaluate(()=>getComputedStyle(document.querySelector(".imk .isin")).opacity));
}
await b.close();
