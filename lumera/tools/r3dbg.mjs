import { chromium } from "playwright-core";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--disable-background-networking","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200);
console.log(await p.evaluate(()=>{const r=e=>{const b=e.getBoundingClientRect(),c=getComputedStyle(e);return e.id+"."+e.className+" "+Math.round(b.top)+"→"+Math.round(b.bottom)+" h"+Math.round(b.height)+" ov"+c.overflow;};
 const cv=document.getElementById("bcv"); let o=[r(cv)]; let e=cv.parentElement; for(let i=0;i<3;i++){o.push(r(e)); e=e.parentElement;} return o.join("\n")+"\ncanvas px "+cv.width+"x"+cv.height;}));
await b.close();
