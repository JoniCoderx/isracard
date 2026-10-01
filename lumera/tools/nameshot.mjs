import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
for (const [w,h,l] of [[1440,900,"en"],[390,844,"en"],[1440,900,"he"]]) {
  const c=await b.newContext({viewport:{width:w,height:h},hasTouch:w<900}); await c.addInitScript(l=>{try{localStorage.setItem("silavu-lang",l)}catch(e){}},l);
  const p=await c.newPage(); await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn",{timeout:2000}).catch(()=>{});
  await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; const t=document.querySelector("#p-knot .bd"); scrollTo(0,t.getBoundingClientRect().top+scrollY-innerHeight*0.45);}); await p.waitForTimeout(1500);
  await p.screenshot({path:O+`names-${w}-${l}.jpg`,type:"jpeg",quality:60});
  if (w===1440 && l==="en") { await p.click("#p-ring .fig"); await p.waitForTimeout(1300); await p.screenshot({path:O+`names-modal.jpg`,type:"jpeg",quality:60}); }
  await c.close();
}
await b.close();
