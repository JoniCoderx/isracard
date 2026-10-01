import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
for (const [w,h] of [[1440,900],[390,844]]) {
  const c=await b.newContext({viewport:{width:w,height:h},hasTouch:w<900}); await c.addInitScript(()=>{try{localStorage.setItem("silavu-lang","he")}catch(e){}});
  const p=await c.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn",{timeout:2000}).catch(()=>{}); await p.waitForTimeout(800);
  await p.screenshot({path:O+`hef-${w}-hero.jpg`,type:"jpeg",quality:55});
  for (const id of ["collection","build","enquire","end"]) { await p.evaluate(id=>{document.documentElement.style.scrollBehavior="auto"; document.getElementById(id).scrollIntoView();},id); await p.waitForTimeout(1500); await p.screenshot({path:O+`hef-${w}-${id}.jpg`,type:"jpeg",quality:55}); }
  console.log(w, await p.evaluate(()=>({dir:document.documentElement.dir, lang:document.documentElement.lang, ov:document.documentElement.scrollWidth-innerWidth})), errs.join("|"));
  await c.close();
}
await b.close();
