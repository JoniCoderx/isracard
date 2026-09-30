import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--disable-background-networking","--disable-component-update"] });
const W=+process.argv[2]||390, H=W===360?740:844;
const ctx = await b.newContext({ viewport:{width:W,height:H}, hasTouch:true, isMobile:true, deviceScaleFactor:2 });
await ctx.addInitScript(l => { localStorage.setItem("silavu-lang", l); localStorage.setItem("silavu-seen","1"); }, process.argv[3]||"he");
const p = await ctx.newPage(); await p.route(/fonts\./, r=>r.abort());
await p.goto("http://127.0.0.1:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(600);
await p.evaluate(()=>{ const e=document.getElementById("configure"); scrollTo(0, e.getBoundingClientRect().top+scrollY); }); await p.waitForTimeout(900);
await p.evaluate(()=>document.querySelector('.chip[data-k="cut"][data-v="emerald"]').click()); await p.waitForTimeout(500);
await p.evaluate(()=>document.getElementById("reserve").scrollIntoView({block:"end"}));
for (const t of [300,800,1600]) { await p.waitForTimeout(t===300?300:t-(t===800?300:800));
  console.log(t, JSON.stringify(await p.evaluate(()=>{ const e=document.getElementById("reserve"), r=e.getBoundingClientRect(), x=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2); const f=document.getElementById("fab"); const tot=e.closest(".total").getBoundingClientRect(); return { r:[Math.round(r.top),Math.round(r.bottom)], vh:innerHeight, top: x && (x.id||x.className||x.tagName), fab: f.className+" op="+getComputedStyle(f).opacity, tot:[Math.round(tot.top),Math.round(tot.bottom)] }; }))); }
await b.close();
