import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
for (const [w,h] of [[1440,900],[375,812]]) for (const [pg,l] of [["about","en"],["privacy","en"],["about","he"],["terms","he"]]) {
  const c=await b.newContext({viewport:{width:w,height:h}}); const p=await c.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.route(/fonts\./,r=>r.abort()); await p.addInitScript(l=>{try{localStorage.setItem("silavu-lang",l)}catch(e){}},l);
  await p.goto(`http://localhost:8777/${pg}/`,{waitUntil:"load"}); await p.waitForTimeout(700);
  await p.screenshot({path:O+`doc-${pg}-${l}-${w}.jpg`,type:"jpeg",quality:60,fullPage:true});
  const r=await p.evaluate(()=>({t:document.title,ov:document.documentElement.scrollWidth-innerWidth,dir:document.dir}));
  console.log(w,pg,l,JSON.stringify(r),errs.join("|")); await c.close();
}
await b.close();
