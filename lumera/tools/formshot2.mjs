import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
for (const [W,H,mob,lang] of [[1440,900,false,"en"],[1440,900,false,"he"],[390,844,true,"en"],[390,844,true,"he"]]) {
  const c=await b.newContext({viewport:{width:W,height:H},hasTouch:mob,isMobile:mob}); await c.addInitScript(l=>{try{localStorage.setItem("silavu-lang",l)}catch(e){}},lang);
  const p=await c.newPage(); await p.goto(`http://localhost:8777/`,{waitUntil:"load"}); await p.waitForTimeout(1300); await p.click("#enterBtn",{timeout:1500}).catch(()=>{});
  await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; document.querySelector(".pgrid .piece .q").click();}); await p.waitForTimeout(1200);
  await p.evaluate(()=>{const e=document.getElementById("enquire"); scrollTo(0,e.getBoundingClientRect().top+scrollY+(innerWidth<700?-60:40)); document.querySelectorAll(".rv").forEach(x=>x.classList.add("in"));}); await p.waitForTimeout(1200);
  await p.screenshot({path:O+`form-${W}-${lang}.jpg`,type:"jpeg",quality:60});
  await c.close();
}
await b.close();
