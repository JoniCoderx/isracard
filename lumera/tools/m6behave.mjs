import { chromium } from "playwright-core";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
let pass=0,fail=0; const ok=(c,m)=>{c?pass++:fail++; console.log((c?"PASS ":"FAIL ")+m);};
for (const [w,h] of [[320,568],[390,844],[430,932]]) {
const p=await (await b.newContext({viewport:{width:w,height:h},isMobile:true,hasTouch:true})).newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(900);
await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; scrollTo(0,1800);}); await p.waitForTimeout(500);
// menu: lock and restore
const y0=await p.evaluate(()=>scrollY);
await p.tap("#menuBtn"); await p.waitForTimeout(700);
const mo=await p.evaluate(()=>({open:document.getElementById("menu").classList.contains("open"), locked:document.documentElement.classList.contains("locked"), btn:document.getElementById("menuClose").getBoundingClientRect().top}));
await p.mouse.wheel(0,600).catch(()=>{}); await p.waitForTimeout(300);
await p.tap("#menuClose"); await p.waitForTimeout(700);
const y1=await p.evaluate(()=>scrollY);
ok(mo.open && mo.locked && y1===y0, `${w} menu locks the page and gives it back (${y0}→${y1})`);
// menu link navigates
await p.tap("#menuBtn"); await p.waitForTimeout(600); await p.tap('#mlist a[href="#collection"]'); await p.waitForTimeout(1500);
const cTop=await p.evaluate(()=>Math.round(document.getElementById("collection").getBoundingClientRect().top));
ok(cTop>-40 && cTop<120 && !(await p.evaluate(()=>document.documentElement.classList.contains("locked"))), `${w} menu link lands on the collection (top ${cTop})`);
// summary bar
await p.evaluate(()=>{const e=document.getElementById("stripwrap"); scrollTo(0,e.getBoundingClientRect().top+scrollY-80);}); await p.waitForTimeout(1200);
await p.evaluate(()=>{const t=document.querySelector("#configure .total"); /* scroll so viewer+tabs fill, total below */ });
const bar1=await p.evaluate(()=>{ const r=document.querySelector("#configure .total").getBoundingClientRect(), vis=Math.max(0,Math.min(innerHeight,r.bottom)-Math.max(0,r.top))/r.height; return {on:document.getElementById("cbar").classList.contains("on"), want:vis<0.35, txt:document.querySelector("#cbar .cbs").textContent}; });
await p.evaluate(()=>document.querySelector("#configure .total").scrollIntoView({block:"center"})); await p.waitForTimeout(900);
const bar2=await p.evaluate(()=>document.getElementById("cbar").classList.contains("on"));
await p.evaluate(()=>document.getElementById("enquire").scrollIntoView()); await p.waitForTimeout(900);
const bar3=await p.evaluate(()=>document.getElementById("cbar").classList.contains("on"));
ok(bar1.on===bar1.want && !bar2 && !bar3, `${w} summary bar: shown only while the estimate is off-screen (${bar1.on}/${bar1.want} ${bar1.txt}); off at the estimate and outside the builder`);
// tabs: exactly one open, and switching works
await p.evaluate(()=>document.getElementById("stripwrap").scrollIntoView()); await p.waitForTimeout(400);
await p.evaluate(()=>[...document.querySelectorAll("#opts .opt > .opthead")][2].click()); await p.waitForTimeout(300);
const tabs=await p.evaluate(()=>[...document.querySelectorAll("#opts .opt")].map(o=>o.classList.contains("open")?1:0).join(""));
await p.evaluate(()=>[...document.querySelectorAll("#opts .opt > .opthead")][2].click()); await p.waitForTimeout(300);
const tabs2=await p.evaluate(()=>[...document.querySelectorAll("#opts .opt")].map(o=>o.classList.contains("open")?1:0).join(""));
ok(tabs==="00100" && tabs2==="00100", `${w} tabs: one open, a second tap keeps it open (${tabs},${tabs2})`);
// reserve from bar
await p.evaluate(()=>{const e=document.getElementById("stripwrap"); scrollTo(0,e.getBoundingClientRect().top+scrollY-80);}); await p.waitForTimeout(1000);
if (await p.evaluate(()=>document.getElementById("cbar").classList.contains("on"))) { await p.tap("#cbar .cbr"); await p.waitForTimeout(1800);
  const r=await p.evaluate(()=>({msg:document.getElementById("fMsg").value, top:Math.round(document.getElementById("concierge").getBoundingClientRect().top)}));
  ok(/ct/.test(r.msg) && r.top<300, `${w} Reserve in the bar writes the enquiry and goes to it (${r.msg.slice(0,50)}…)`); }
ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)===0 && errs.length===0, `${w} no sideways scroll, no errors ${errs.join("|")}`);
await p.close(); }
await b.close(); console.log(pass,"pass,",fail,"fail");
