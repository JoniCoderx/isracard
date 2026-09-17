import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2 });
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
await p.waitForTimeout(3000); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{
  const out=[]; let ok=0, bad=0; const badly=[];
  document.querySelectorAll('.btn, .chip, .lang, .menubtn, .cert, .soc a, .vp').forEach(e=>{
    const cs=getComputedStyle(e); if(cs.display==="none"||cs.visibility==="hidden") return;
    const r=e.getBoundingClientRect(); if(r.width<2||r.height<2) return;
    const a=getComputedStyle(e,"::after");
    const h=parseFloat(a.height)||0;
    const eff=Math.max(r.height, h);
    if (eff>=40) ok++; else { bad++; if(badly.length<6) badly.push((e.textContent||e.id||"?").trim().slice(0,16)+" visual="+Math.round(r.height)+" tap="+Math.round(eff)); }
  });
  return "controls with a tap area >= 40px: "+ok+"\ncontrols still short: "+bad+(badly.length?"\n   "+badly.join("\n   "):"");
}));
await b.close();
