import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
for (const [W,H,lang] of [[1440,900,"en"],[1440,900,"he"],[390,844,"en"],[390,844,"he"]]) {
  const c=await b.newContext({viewport:{width:W,height:H},isMobile:W<700,hasTouch:W<700}); await c.addInitScript(l=>{try{localStorage.setItem("silavu-lang",l)}catch(e){}},lang);
  const p=await c.newPage(); await p.goto("http://localhost:8777/about/",{waitUntil:"load"}); await p.waitForTimeout(900);
  await p.screenshot({path:O+`ab-${W}-${lang}.jpg`,type:"jpeg",quality:60, fullPage:W<700});
  await c.close();
}
await b.close();
