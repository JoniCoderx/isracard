import { chromium } from "playwright-core";
const U="http://localhost:8777/", O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/r3/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--disable-background-networking","--disable-component-update"]});
for (const [tag,w,h,lang] of [["d-en",1440,900,"en"],["d-he",1440,900,"he"],["m-en",390,844,"en"],["m-he",390,844,"he"]]) {
  const c=await b.newContext({viewport:{width:w,height:h},hasTouch:w<900}); const p=await c.newPage(); const errs=[];
  p.on("pageerror",e=>errs.push(e.message)); await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  await p.addInitScript(l=>{try{localStorage.setItem("silavu-lang",l)}catch(e){}},lang);
  await p.goto(U,{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn",{timeout:3000}).catch(()=>{}); await p.waitForTimeout(800);
  await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; const e=document.getElementById("enquire"); scrollTo(0, e.getBoundingClientRect().top+scrollY - 60);}); await p.waitForTimeout(4500);
  await p.screenshot({path:O+`enq-${tag}.jpg`,type:"jpeg",quality:70});
  if (w>900) { const r=await p.$eval("#emb",e=>{const b=e.getBoundingClientRect();return {x:b.x+b.width*0.62,y:b.y+b.height*0.35}}); await p.mouse.move(r.x-40,r.y); await p.mouse.move(r.x,r.y,{steps:8}); await p.waitForTimeout(1300); await p.screenshot({path:O+`enq-${tag}-hover.jpg`,type:"jpeg",quality:70}); }
  const hs=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  console.log(tag,"hscroll",hs,"errs",errs.join("|"));
  await c.close();
}
await b.close();
