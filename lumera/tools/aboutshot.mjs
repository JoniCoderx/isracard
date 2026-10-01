import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
for (const [w,h,l] of [[1440,900,"en"],[390,844,"en"],[1440,900,"he"]]) {
  const c=await b.newContext({viewport:{width:w,height:h}}); await c.addInitScript(l=>{try{localStorage.setItem("silavu-lang",l)}catch(e){}},l);
  const p=await c.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("http://localhost:8777/about/",{waitUntil:"load"}); await p.waitForTimeout(900);
  console.log(w,l,await p.evaluate(()=>({ov:document.documentElement.scrollWidth-innerWidth,t:document.title})), errs.join("|"));
  await p.screenshot({path:O+`about2-${w}-${l}.jpg`,type:"jpeg",quality:55,fullPage:true});
}
await b.close();
