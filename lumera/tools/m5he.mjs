import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort()); await p.addInitScript(()=>{try{localStorage.setItem("silavu-lang","he")}catch(e){}});
await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(900);
await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; const e=document.getElementById("configure"); scrollTo(0,e.getBoundingClientRect().top+scrollY+260);}); await p.waitForTimeout(2500);
// open metal tab and pick yellow
await p.evaluate(()=>{ const h=[...document.querySelectorAll("#opts .opt > .opthead")][4]; h.click(); }); await p.waitForTimeout(400);
await p.evaluate(()=>document.querySelector('.chip[data-k="metal"][data-v="yellow"]').click()); await p.waitForTimeout(1200);
await p.screenshot({path:O+"he-conf.jpg",type:"jpeg",quality:60});
const st=await p.evaluate(()=>({open:[...document.querySelectorAll("#opts .opt")].map(o=>o.classList.contains("open")?1:0).join(""), bar:document.getElementById("cbar").classList.contains("on"), barText:document.getElementById("cbar").textContent, hs:document.documentElement.scrollWidth-innerWidth}));
console.log(JSON.stringify(st), errs.join("|")||"clean"); await b.close();
