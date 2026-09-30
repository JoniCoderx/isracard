import { chromium } from "playwright-core";
const OUT="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/sec/"; import fs from "fs"; fs.mkdirSync(OUT,{recursive:true});
const [W,H,lang] = [+process.argv[2], +process.argv[3], process.argv[4]];
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--disable-background-networking","--disable-component-update","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport:{width:W,height:H}, hasTouch:W<900, isMobile:W<900 });
await ctx.addInitScript(l=>{localStorage.setItem("silavu-lang",l);localStorage.setItem("silavu-seen","1");},lang);
const p = await ctx.newPage(); await p.route(/fonts\./, r=>r.abort());
await p.goto("http://127.0.0.1:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(1500);
const secs = await p.evaluate(()=>[...document.querySelectorAll("main > section, main > div[id], section[id]")].filter((s,i,a)=>s.id && a.findIndex(x=>x.id===s.id)===i).map(s=>({id:s.id, top:Math.round(s.getBoundingClientRect().top+scrollY), h:Math.round(s.getBoundingClientRect().height)})));
console.log(JSON.stringify(secs));
let k=0;
for (const s of secs) {
  const n = Math.min(4, Math.max(1, Math.round(s.h / H)));
  for (let i=0;i<n;i++) { const y = s.top + (n===1?0:(s.h-H)*i/(n-1)); await p.evaluate(y=>scrollTo(0,y), Math.max(0,Math.round(y))); await p.waitForTimeout(900);
    await p.screenshot({ path: OUT+`${W}-${lang}-${String(++k).padStart(2,"0")}-${s.id}-${i}.png` }); }
}
await b.close();
