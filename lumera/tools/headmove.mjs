import { chromium } from "playwright-core";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
for (const [w,h] of [[1440,900],[390,844]]) {
const p=await (await b.newContext({viewport:{width:w,height:h},hasTouch:w<900})).newPage();
await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn",{timeout:2000}).catch(()=>{});
const top=await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; const hh=[...document.querySelectorAll("#collection .h2")][0]; return hh.getBoundingClientRect().top+scrollY;});
for (const off of [0.9,0.7,0.5,0.3,0.1]) {
  await p.evaluate(([t,o])=>scrollTo(0,t-innerHeight*o),[top,off]); await p.waitForTimeout(700);
  const r=await p.evaluate(()=>{const hh=document.querySelector("#collection .h2"), hr=hh.getBoundingClientRect(); const ws=[...hh.querySelectorAll(".w")].map(x=>{const r=x.getBoundingClientRect(); return Math.round(r.left-hr.left)+","+Math.round(r.top-hr.top);}); const cs=getComputedStyle(hh); return {ws:ws.join(" "), tf:cs.transform, ls:cs.letterSpacing, wsp:cs.wordSpacing, fs:cs.fontSize, cls:hh.className};});
  console.log(w,off,JSON.stringify(r));
}}
await b.close();
