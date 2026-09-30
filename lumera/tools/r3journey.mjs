import { chromium } from "playwright-core";
const U="http://localhost:8777/", O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/r3/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--disable-background-networking","--disable-component-update"]});
for (const [tag,w,h,lang] of [["d-en",1440,900,"en"],["m-he",390,844,"he"]]) {
  const c=await b.newContext({viewport:{width:w,height:h},hasTouch:w<900}); const p=await c.newPage(); const errs=[];
  p.on("pageerror",e=>errs.push(e.message)); await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  await p.addInitScript(l=>{try{localStorage.setItem("silavu-lang",l)}catch(e){}},lang);
  await p.goto(U,{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn",{timeout:3000}).catch(()=>{}); await p.waitForTimeout(800);
  await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; const e=document.getElementById("bespoke"); scrollTo(0,e.getBoundingClientRect().top+scrollY);}); await p.waitForTimeout(2500);
  await p.screenshot({path:O+`jr-${tag}-head.jpg`,type:"jpeg",quality:65});
  for (const f of [0.0,0.45]) {
    const st=await p.evaluate(f=>{const e=document.getElementById("jpin"); const top=e.getBoundingClientRect().top+scrollY; scrollTo(0, top+(e.offsetHeight-innerHeight)*f); return 1;},f); await p.waitForTimeout(1600);
    const info=await p.evaluate(()=>({now:document.getElementById("jnow").textContent, on:[...document.querySelectorAll(".jstep")].findIndex(s=>s.classList.contains("on")), img:[...document.querySelectorAll(".jshot.on img")].map(i=>i.naturalWidth)}));
    console.log(tag,f,JSON.stringify(info));
    await p.screenshot({path:O+`jr-${tag}-${f}.jpg`,type:"jpeg",quality:65});
  }
  console.log(tag,"errs",errs.join("|")); await c.close();
}
await b.close();
{ const b2=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--disable-background-networking","--disable-component-update"]});
  const p=await (await b2.newContext({viewport:{width:1440,height:900}})).newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn",{timeout:3000}).catch(()=>{}); await p.waitForTimeout(800);
  await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; const e=document.getElementById("collection"); scrollTo(0,e.getBoundingClientRect().top+scrollY);}); await p.waitForTimeout(2500);
  await p.screenshot({path:"/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/r3/col.jpg",type:"jpeg",quality:65}); await b2.close(); }
