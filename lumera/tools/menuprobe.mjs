import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
await p.waitForTimeout(3000); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
await p.waitForTimeout(700);
await p.evaluate(()=>{const m=document.getElementById("menuBtn"); m&&m.click();});
await p.waitForTimeout(1600);
console.log(await p.evaluate(()=>{
  const m=document.getElementById("menu"); const cs=getComputedStyle(m);
  return "open="+m.classList.contains("open")
   +"\n opacity="+cs.opacity+"  bg="+cs.backgroundColor
   +"\n backdrop="+(cs.backdropFilter||cs.webkitBackdropFilter||"none")
   +"\n z="+cs.zIndex+"  position="+cs.position
   +"\n what paints at the centre: "+document.elementsFromPoint(195,500).slice(0,3).map(e=>e.tagName+"#"+(e.id||"")+"."+(e.className||"").toString().split(" ")[0]).join(" > ");
}));
await b.close();
