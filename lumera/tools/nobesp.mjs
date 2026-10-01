import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
for (const [w,h] of [[1440,900],[390,844]]) {
  const p=await (await b.newContext({viewport:{width:w,height:h},hasTouch:w<900})).newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.route(/fonts\./,r=>r.abort()); await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn",{timeout:2000}).catch(()=>{});
  await p.click("#hero .hsec"); await p.waitForTimeout(2500);
  const r=await p.evaluate(()=>({msg:document.getElementById("fMsg").value, top:Math.round(document.getElementById("concierge").getBoundingClientRect().top), order:[...document.querySelectorAll("main > section")].map(s=>s.id).join(" > ")}));
  console.log(w, JSON.stringify(r), errs.join("|")||"no errors");
  await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; const c=document.getElementById("collection"); scrollTo(0,c.getBoundingClientRect().bottom+scrollY-h*0.5);}).catch(()=>{});
}
await b.close();
