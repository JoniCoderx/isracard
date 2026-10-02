import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
const [mode,W,...ys]=process.argv.slice(2);
const p=await (await b.newContext({viewport:{width:+W,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true})).newPage();
await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn",{timeout:2000}).catch(()=>{}); await p.waitForTimeout(600);
await p.evaluate(()=>document.documentElement.style.scrollBehavior="auto");
if (mode==="wrist") { await p.evaluate(()=>document.getElementById("build").scrollIntoView()); await p.waitForTimeout(600); await p.evaluate(()=>document.querySelector('.vtb[data-view="wrist"]').click()); await p.waitForTimeout(600); }
for (const y of ys) { await p.evaluate(y=>scrollTo(0,+y),y); await p.waitForTimeout(900); await p.screenshot({path:O+`at-${mode}-${W}-${y}.jpg`,type:"jpeg",quality:60}); }
console.log(await p.evaluate(()=>{const f=document.getElementById("fab"),c=document.getElementById("cbar"); return [f.outerHTML.slice(0,160), c.outerHTML.slice(0,160)];}));
await b.close();
