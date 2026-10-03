import { chromium } from "playwright-core";
/* before/after tour: node tour.mjs <port> <outdir> */
const [port, out] = [process.argv[2]||"8777", process.argv[3]||"after"];
const O=`/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/${out}/`;
import fs from "fs"; fs.mkdirSync(O,{recursive:true});
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
async function page(w,h,mob,lang){
  const c=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:mob,isMobile:mob});
  if (lang) await c.addInitScript(l=>{try{localStorage.setItem("silavu-lang",l)}catch(e){}},lang);
  const p=await c.newPage(); await p.goto(`http://localhost:${port}/`,{waitUntil:"load"}); await p.waitForTimeout(1200);
  await p.click("#enterBtn",{timeout:1500}).catch(()=>{}); await p.waitForTimeout(500);
  await p.evaluate(()=>document.documentElement.style.scrollBehavior="auto"); return p;}
async function to(p,sel,off=70){ await p.evaluate(([s,o])=>{const e=document.querySelector(s); if(e) scrollTo(0,e.getBoundingClientRect().top+scrollY-o); document.querySelectorAll(".rv").forEach(x=>x.classList.add("in"));},[sel,off]); await p.waitForTimeout(1300); }
for (const [w,h,mob,tag] of [[1440,900,false,"d"],[390,844,true,"m"]]) for (const lang of ["en","he"]) {
  const p=await page(w,h,mob,lang), k=`${tag}-${lang}`;
  await p.screenshot({path:O+`${k}-1hero.jpg`,type:"jpeg",quality:55});
  await to(p,"#collection .pgrid"); await p.screenshot({path:O+`${k}-2cards.jpg`,type:"jpeg",quality:55});
  const f=p.locator(".pgrid .piece:not(.soon) .fig").first(); if (mob) await f.tap(); else await f.click(); await p.waitForTimeout(1200);
  await p.screenshot({path:O+`${k}-3modal.jpg`,type:"jpeg",quality:55});
  await p.keyboard.press("Escape"); await p.waitForTimeout(600);
  await to(p,"#concierge",20); await p.screenshot({path:O+`${k}-4form.jpg`,type:"jpeg",quality:55});
  await to(p,"#build",20); await p.screenshot({path:O+`${k}-5build.jpg`,type:"jpeg",quality:55});
  await p.goto(`http://localhost:${port}/about/`,{waitUntil:"load"}); await p.waitForTimeout(900);
  await p.screenshot({path:O+`${k}-6about.jpg`,type:"jpeg",quality:55});
  await p.context().close();
}
console.log("tour", port, "->", O); await b.close();
