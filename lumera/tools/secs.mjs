import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
await p.waitForTimeout(3000); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
await p.waitForTimeout(1200);
console.log(await p.evaluate(()=>{
  const rows=[...document.querySelectorAll(".sm section[id]")].map(s=>({id:s.id,sc:+(s.getBoundingClientRect().height/innerHeight).toFixed(2)}));
  rows.sort((a,b)=>b.sc-a.sc);
  const pins=[...document.querySelectorAll('[id$="pin"], .pin')].map(e=>e.id+"="+(e.getBoundingClientRect().height/innerHeight).toFixed(2)+"sc");
  return rows.map(r=>"  "+r.id.padEnd(12)+r.sc).join("\n")+"\n PINS: "+pins.join(" ")+"\n TOTAL="+(document.documentElement.scrollHeight/innerHeight).toFixed(1);
}));
await b.close();
