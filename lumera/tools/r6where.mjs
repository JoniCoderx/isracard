import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/r4/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--disable-background-networking"]});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn",{timeout:3000}).catch(()=>{}); await p.waitForTimeout(800);
for (const id of ["bespoke","build"]) { await p.evaluate(id=>{document.documentElement.style.scrollBehavior="auto"; const e=document.getElementById(id); scrollTo(0,e.getBoundingClientRect().top+scrollY+300);},id); await p.waitForTimeout(300); await p.mouse.wheel(0,40); await p.waitForTimeout(900);
  await p.screenshot({path:O+`where-${id}.png`,clip:{x:40,y:800,width:360,height:100}}); }
await b.close();
