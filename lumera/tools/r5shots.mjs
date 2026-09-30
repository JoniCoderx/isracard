import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/r4/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--disable-background-networking","--disable-component-update"]});
for (const [dv,w,h,lang] of [["d-en",1440,900,"en"],["m-he",390,844,"he"]]) {
  const p=await (await b.newContext({viewport:{width:w,height:h},hasTouch:w<900})).newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort()); await p.addInitScript(l=>{try{localStorage.setItem("silavu-lang",l)}catch(e){}},lang);
  await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn",{timeout:3000}).catch(()=>{}); await p.waitForTimeout(800);
  await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; const e=document.getElementById("emb"); scrollTo(0,e.getBoundingClientRect().top+scrollY-120);}); await p.waitForTimeout(5000);
  await (await p.$("#emb")).screenshot({path:O+`emb-${dv}.png`});
  if (w>900) { const r=await p.$eval("#emb",e=>{const b=e.getBoundingClientRect();return {x:b.x+b.width*0.6,y:b.y+b.height*0.35}}); await p.mouse.move(r.x,r.y,{steps:6}); await p.waitForTimeout(1300); await (await p.$("#emb")).screenshot({path:O+`emb-${dv}-hov.png`}); }
  await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight)); await p.waitForTimeout(2500);
  await p.screenshot({path:O+`foot-${dv}.jpg`,type:"jpeg",quality:70});
  console.log(dv, errs.join("|")||"clean", await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth));
}
await b.close();
