import { chromium } from "playwright-core";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true})).newPage();
await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn",{timeout:2000}).catch(()=>{}); await p.waitForTimeout(600);
await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; scrollTo(0,7650);}); await p.waitForTimeout(900);
console.log(await p.evaluate(()=>document.elementsFromPoint(195,458).filter(e=>!e.closest("#intro")).slice(0,6).map(e=>e.tagName+"#"+e.id+"."+[...e.classList].join(".")+" "+Math.round(e.getBoundingClientRect().height)).join("\n")));
await b.close();
