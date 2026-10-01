import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/", TAG=process.argv[2]||"s", W=+(process.argv[3]||390), H=+(process.argv[4]||844);
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--disable-background-networking","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]});
const ctx=await b.newContext({viewport:{width:W,height:H},hasTouch:true,isMobile:true,deviceScaleFactor:2}); const p=await ctx.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn",{timeout:3000}).catch(()=>{}); await p.waitForTimeout(900);
const shot=async n=>p.screenshot({path:O+`${TAG}-${W}-${n}.jpg`,type:"jpeg",quality:60});
const go=async(id,off=0)=>{ await p.evaluate(([id,off])=>{document.documentElement.style.scrollBehavior="auto"; const e=document.getElementById(id); scrollTo(0,e.getBoundingClientRect().top+scrollY+off);},[id,off]); await p.waitForTimeout(900); };
// menu
await p.tap("#menuBtn").catch(()=>p.click("#menuBtn")); await p.waitForTimeout(900); await shot("menu");
console.log("menu lock", await p.evaluate(()=>({html:getComputedStyle(document.documentElement).overflow, body:getComputedStyle(document.body).overflow, cls:document.documentElement.className})));
await p.click("#menuClose").catch(()=>{}); await p.waitForTimeout(700);
// collection full
await go("collection"); const col=await p.$("#collection"); await col.screenshot({path:O+`${TAG}-${W}-collection-full.jpg`,type:"jpeg",quality:50});
// modal
await go("collection",500); await p.evaluate(()=>document.querySelector("#p-ring .lnk.vw").click()); await p.waitForTimeout(1400); await shot("modal-top");
await p.evaluate(()=>{const m=document.querySelector("#pmodal .mbox"); m.scrollTop=m.scrollHeight;}); await p.waitForTimeout(600); await shot("modal-bottom");
await p.keyboard.press("Escape"); await p.waitForTimeout(600);
// configurator
await go("configure",-70); await p.waitForTimeout(2500); await shot("conf-1");
const cf=await p.$("#configure"); await cf.screenshot({path:O+`${TAG}-${W}-conf-full.jpg`,type:"jpeg",quality:50});
await go("configure",500); await shot("conf-2");
// wrist view
await go("configure",-70); await p.evaluate(()=>{const t=[...document.querySelectorAll("#stripwrap .vtb")].find(b=>/wrist/i.test(b.textContent)); if(t) t.click();}); await p.waitForTimeout(2500); await shot("conf-wrist");
await p.evaluate(()=>{const t=[...document.querySelectorAll("#stripwrap .vtb")].find(b=>/line/i.test(b.textContent)); if(t) t.click();}); await p.waitForTimeout(800);
// try-on
await p.evaluate(()=>window.__tryon && window.__tryon.open()); await p.waitForTimeout(1200); await shot("tryon");
await p.keyboard.press("Escape"); await p.waitForTimeout(600);
// enquiry
await go("enquire"); await shot("enq-1"); await go("enquire",500); await shot("enq-2");
await p.tap("#fName").catch(()=>{}); await p.waitForTimeout(500); await shot("enq-focus");
console.log("errs",errs.join("|")||"none");
await b.close();
