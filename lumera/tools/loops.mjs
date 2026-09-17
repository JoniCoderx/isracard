import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });
await p.addInitScript(()=>{
  window.__sites={}; const o=window.requestAnimationFrame;
  window.requestAnimationFrame=function(f){
    try{ const st=new Error().stack.split("\n")[2]||"?"; const k=st.trim().slice(0,90); window.__sites[k]=(window.__sites[k]||0)+1; }catch(e){}
    return o.call(window,f); };
});
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
await p.waitForTimeout(3000); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
await p.waitForTimeout(1200);
await p.evaluate(()=>{window.__sites={};});
await p.waitForTimeout(3000);
console.log("rAF callers while sitting at the top of the page, over 3s:\n");
console.log(await p.evaluate(()=>Object.entries(window.__sites).sort((a,b)=>b[1]-a[1]).slice(0,10)
  .map(([k,v])=>"  "+String(v).padStart(4)+"  "+k).join("\n")));
await b.close();
