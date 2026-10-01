import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(800);
for (const id of (process.argv[2]||"end").split(",")) { await p.evaluate(id=>{document.documentElement.style.scrollBehavior="auto"; document.getElementById(id).scrollIntoView();},id); await p.waitForTimeout(1500);
  await (await p.$("#"+id)).screenshot({path:O+`el-${id}.jpg`,type:"jpeg",quality:55}); console.log(id, await p.evaluate(id=>document.getElementById(id).offsetHeight,id)); }
await b.close();
