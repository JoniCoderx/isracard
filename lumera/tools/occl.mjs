import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
await p.waitForTimeout(3200); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
await p.waitForTimeout(900);
for (const y of [2500,6000,8500,10128,11500,13000,15000]) {
  await p.evaluate(v=>window.scrollTo({top:v,behavior:"instant"}), y);
  await p.waitForTimeout(800);
  const r = await p.evaluate(()=>{
    const hdr=document.querySelector("header.sh"); const hb=hdr.getBoundingClientRect();
    const zs=[]; // what paints at the header band, ignoring the header itself
    [[40,hb.height/2],[195,10],[195,hb.height-6],[350,hb.height/2]].forEach(([x,yy])=>{
      const els=document.elementsFromPoint(x,yy);
      const above=[]; let seenHdr=false;
      for (const e of els){ if(e===hdr||hdr.contains(e)){seenHdr=true;break;} above.push((e.tagName+"."+(e.className||"").toString().split(" ")[0]+"#"+(e.id||"")).slice(0,34)+"(z"+getComputedStyle(e).zIndex+")"); }
      if(above.length) zs.push("@"+x+","+Math.round(yy)+" over: "+above.join(" > "));
    });
    return { cls:hdr.className, bg:getComputedStyle(hdr).backgroundColor, h:Math.round(hb.height), over:zs };
  });
  console.log("y="+y+"  hdrH="+r.h+"  bg="+r.bg+"  scrolled="+/scrolled/.test(r.cls));
  r.over.forEach(o=>console.log("     "+o));
}
await b.close();
