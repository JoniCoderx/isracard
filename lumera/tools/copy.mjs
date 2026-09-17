import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
await p.waitForTimeout(3200); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
await p.waitForTimeout(1000);
console.log(await p.evaluate(()=>{
  const out=[]; let total=0;
  document.querySelectorAll(".sm section[id]").forEach(s=>{
    const ps=[...s.querySelectorAll("p, .p, .fine, .certnote, .k:not(.gold)")]
      .map(e=>({t:(e.innerText||"").trim(), w:(e.innerText||"").trim().split(/\s+/).filter(Boolean).length, cls:e.className.split(" ")[0]}))
      .filter(x=>x.w>=12);
    const sw=ps.reduce((a,x)=>a+x.w,0); total+=sw;
    if (ps.length) { out.push("\n### "+s.id+"  ("+sw+" words in "+ps.length+" blocks)");
      ps.sort((a,b)=>b.w-a.w).slice(0,3).forEach(x=>out.push("   ["+x.w+"w ."+x.cls+"] "+x.t.replace(/\s+/g," ").slice(0,150))); }
  });
  return out.join("\n")+"\n\nTOTAL prose words: "+total;
}));
await b.close();
