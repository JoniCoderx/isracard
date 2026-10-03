import { chromium } from "playwright-core";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1000); await p.click("#enterBtn",{timeout:1500}).catch(()=>{});
await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; scrollTo(0,document.body.scrollHeight);}); await p.waitForTimeout(1500);
console.log(await p.evaluate(()=>{const e=[...document.querySelectorAll("body *")].find(x=>getComputedStyle(x).position==="fixed" && /enquire/i.test(x.textContent) && x.getBoundingClientRect().left<200 && x.getBoundingClientRect().top>600); return e? e.outerHTML.slice(0,300):"none";}));
console.log(await p.evaluate(()=>{const l=document.querySelector(".hlang, #langBtn, .lang"); const bk=document.querySelector(".hbook"); const r=x=>{const b=x.getBoundingClientRect(); return [Math.round(b.width),Math.round(b.height)];}; return JSON.stringify({lang:l&&r(l), lcls:l&&l.className, book:r(bk)});}));
await b.close();
