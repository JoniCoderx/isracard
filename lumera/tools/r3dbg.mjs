import { chromium } from "playwright-core";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1000);
console.log(await p.evaluate(()=>["#p-knot","#p-ring","#p-pave"].map(s=>{const e=document.querySelector(s),c=getComputedStyle(e); return s+" "+c.display+" | "+c.gridTemplateColumns+" | cls="+e.className+" | gc="+c.gridColumn;}).join("\n")+"\npgrid data-n="+document.querySelector(".pgrid").getAttribute("data-n")+" cols="+getComputedStyle(document.querySelector(".pgrid")).gridTemplateColumns));
await b.close();
