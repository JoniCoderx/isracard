import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [n,w,h,mob] of [["desk",1440,900,false],["mob",390,844,true]]) {
  const p = await b.newPage({ viewport:{width:w,height:h}, isMobile:mob, hasTouch:mob });
  const errs=[]; p.on("pageerror",e=>errs.push(String(e).slice(0,140)));
  await p.addInitScript(()=>{ window.__marks=[]; const push=(k)=>window.__marks.push(k+"@"+Math.round(performance.now()));
    document.addEventListener("DOMContentLoaded",()=>{ const i=document.getElementById("intro"); if(!i) return;
      new MutationObserver(()=>{ const c=i.className; if(c.includes("sharp")&&!window.__s){window.__s=1;push("sharp");}
        if(c.includes("lift")&&!window.__l){window.__l=1;push("lift");} if(c.includes("gone")&&!window.__g){window.__g=1;push("gone");} }).observe(i,{attributes:true,attributeFilter:["class"]}); }); });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html?intro=1",{waitUntil:"load"});
  await p.waitForTimeout(6500);
  const r = await p.evaluate(()=>({marks:window.__marks||[], intro:(()=>{const i=document.getElementById("intro"); if(!i)return"removed"; const c=getComputedStyle(i); return "disp="+c.display+" op="+c.opacity;})(),
    hdr:(()=>{const s=document.querySelector("header.sh"); return s?("show="+s.classList.contains("show")+" premark="+s.classList.contains("premark")):"-";})(),
    locked:document.documentElement.classList.contains("locked")}));
  console.log(n+": "+JSON.stringify(r)+" errors="+errs.length+(errs.length?" :: "+errs[0]:""));
  await p.close();
}
await b.close();
