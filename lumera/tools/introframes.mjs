import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html?intro=1",{waitUntil:"commit"});
// sample the painted pixels of the mark region in real time, no pausing
const out = await p.evaluate(async () => {
  const log=[]; const t0=performance.now();
  for (let i=0;i<40;i++){
    const el=document.querySelector(".imk");
    if(el){
      const cs=getComputedStyle(el), r=el.getBoundingClientRect();
      const f=el.querySelector(".if"), s=el.querySelector(".is"), fin=f?getComputedStyle(f):null;
      log.push(Math.round(performance.now()-t0)+"ms imkOp="+cs.opacity+" tr="+cs.transform.slice(0,26)
        +" ifOp="+(fin?fin.opacity:"-")+" ifBg="+(fin?fin.backgroundImage.slice(0,22):"-")
        +" mask="+(fin?(fin.maskImage||fin.webkitMaskImage||"none").slice(0,18):"-")
        +" w="+Math.round(r.width));
    } else log.push(Math.round(performance.now()-t0)+"ms NO .imk");
    await new Promise(r=>setTimeout(r,60));
  }
  return log;
});
out.forEach(l=>console.log(l));
await b.close();
