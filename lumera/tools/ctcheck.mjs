import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--disable-background-networking","--disable-component-update"] });
for (const lang of ["en","he","fr"]) {
  const ctx = await b.newContext({ viewport:{width:1280,height:800} }); await ctx.addInitScript(l=>{localStorage.setItem("silavu-lang",l);localStorage.setItem("silavu-seen","1");},lang);
  const p = await ctx.newPage(); await p.route(/fonts\./, r=>r.abort()); await p.goto("http://127.0.0.1:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(800);
  await p.evaluate(()=>document.querySelector('.chip[data-k="cut"][data-v="emerald"]').click()); await p.waitForTimeout(300);
  console.log(lang, JSON.stringify(await p.evaluate(()=>({ stones: document.getElementById("sumStones").textContent, each: document.getElementById("eachCt").textContent, lbl: document.getElementById("eachLbl").textContent, total: document.querySelector('.chip[data-k="ct"].on') && document.querySelector('.chip[data-k="ct"].on').textContent.trim() }))));
  await ctx.close(); }
await b.close();
