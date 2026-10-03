import { chromium } from "playwright-core";
/* walk the whole page in a language and photograph each screen */
const [port,lang,W,H,out]=[process.argv[2]||"8777",process.argv[3]||"he",+(process.argv[4]||1440),+(process.argv[5]||900),process.argv[6]||"rtl"];
const O=`/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/${out}/`; import fs from "fs"; fs.mkdirSync(O,{recursive:true});
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
const mob=W<700; const c=await b.newContext({viewport:{width:W,height:H},hasTouch:mob,isMobile:mob});
await c.addInitScript(l=>{try{localStorage.setItem("silavu-lang",l)}catch(e){}},lang);
const p=await c.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
await p.goto(`http://localhost:${port}/`,{waitUntil:"load"}); await p.waitForTimeout(1300); await p.click("#enterBtn",{timeout:1500}).catch(()=>{}); await p.waitForTimeout(500);
await p.evaluate(()=>document.documentElement.style.scrollBehavior="auto");
const secs=await p.evaluate(()=>[...document.querySelectorAll("main > section, main > div > section, #end")].map(s=>({id:s.id||s.className.split(" ")[0], top:Math.round(s.getBoundingClientRect().top+scrollY), h:s.offsetHeight})).filter(s=>s.h>50));
let i=0; for (const s of secs) { for (const off of (s.h>H*2.5? [0.05,0.5,0.9] : [0])) { const y=s.top+Math.round((s.h-H)*Math.max(0,off)); await p.evaluate(y=>{scrollTo(0,y); document.querySelectorAll(".rv").forEach(x=>x.classList.add("in"));},y); await p.waitForTimeout(900);
  await p.screenshot({path:O+`${lang}-${W}-${String(i++).padStart(2,"0")}-${s.id}.jpg`,type:"jpeg",quality:50}); } }
const hscroll=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
console.log(lang,W,"screens",i,"dir",await p.evaluate(()=>document.documentElement.dir),"overflowX",hscroll,"errors",errs.join("|")||"none");
await b.close();
