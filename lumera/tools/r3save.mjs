import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/r3/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--disable-background-networking","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]});
for (const lang of ["en","he"]) {
const c=await b.newContext({viewport:{width:1440,height:900},acceptDownloads:true}); const p=await c.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort()); await p.addInitScript(l=>{try{localStorage.setItem("silavu-lang",l)}catch(e){}},lang);
await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn",{timeout:3000}).catch(()=>{}); await p.waitForTimeout(800);
await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; document.getElementById("configure").scrollIntoView();}); await p.waitForTimeout(4000);
await p.evaluate(()=>document.querySelector('.chip[data-k="cut"][data-v="emerald"]').click()); await p.waitForTimeout(1500);
const [dl]=await Promise.all([p.waitForEvent("download",{timeout:15000}), p.click("#saveImg")]); await dl.saveAs(O+`design-${lang}.png`); console.log(lang,"saved",dl.suggestedFilename());
const [dl2]=await Promise.all([p.waitForEvent("download",{timeout:15000}), p.click("#sendSpec")]); await p.waitForTimeout(2000);
const st=await p.evaluate(()=>({msg:document.getElementById("fMsg").value, top:Math.round(document.getElementById("concierge").getBoundingClientRect().top)}));
console.log(lang,"send →",dl2.suggestedFilename(),JSON.stringify(st),errs.join("|")); await c.close(); }
await b.close();
