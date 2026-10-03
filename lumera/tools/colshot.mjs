import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p=await c.newPage();
await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1300); await p.click("#enterBtn",{timeout:1500}).catch(()=>{});
await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; document.querySelectorAll(".rv").forEach(x=>x.classList.add("in"));});
const el=await p.$(process.argv[2]||"#collection"); await el.screenshot({path:O+(process.argv[3]||"col.jpg"),type:"jpeg",quality:55});
await b.close();
