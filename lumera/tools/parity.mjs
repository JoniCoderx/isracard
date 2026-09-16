import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const res={};
for (const [n,w,h,mob] of [["desk",1440,900,false],["mob",390,844,true]]) {
  const p = await b.newPage({ viewport:{width:w,height:h}, isMobile:mob, hasTouch:mob });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
  await p.waitForTimeout(3000); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
  await p.evaluate(async()=>{ const H=document.documentElement.scrollHeight; for(let y=0;y<H;y+=innerHeight*0.6){window.scrollTo(0,y); await new Promise(r=>setTimeout(r,60));} window.scrollTo(0,0); });
  await p.waitForTimeout(2000);
  res[n] = await p.evaluate(()=>{
    const norm=s=>(s||"").split("/").pop().split("?")[0].replace(/-\d+\.(jpg|png|webp)$/,"");
    const seen=new Set();
    document.querySelectorAll("img").forEach(img=>{ if(getComputedStyle(img).display==="none") return; const b=norm(img.getAttribute("src")); if(b) seen.add(b); });
    return { imgs:[...seen].sort() };
  });
  await p.close();
}
const D=new Set(res.desk.imgs), M=new Set(res.mob.imgs);
console.log("desktop-only:", res.desk.imgs.filter(x=>!M.has(x)).join(", ")||"(none)");
console.log("mobile-only :", res.mob.imgs.filter(x=>!D.has(x)).join(", ")||"(none)");
console.log("shared count:", res.desk.imgs.filter(x=>M.has(x)).length);
await b.close();
