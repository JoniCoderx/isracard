import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const out = {};
for (const lang of ["en","he"]) {
  const p = await b.newPage({ viewport:{width:1280,height:800} }); const errs=[]; p.on("pageerror", e=>errs.push(e.message));
  await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" }); await p.waitForTimeout(2000); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(600);
  if (lang==="he") { await p.click("#langBtn"); await p.click('[data-lang="he"]').catch(()=>{}); await p.waitForTimeout(800); }
  await p.evaluate(() => { const q=(k,v)=>document.querySelector(`.chip[data-k="${k}"][data-v="${v}"]`).click(); q("cut","emerald"); q("metal","yellow"); });
  await p.waitForTimeout(500);
  await p.evaluate(() => document.getElementById("reserve").click()); await p.waitForTimeout(300);
  out[lang] = { msg: await p.$eval("#fMsg", e=>e.value), hash: await p.evaluate(()=>location.hash), errs };
  await p.evaluate(() => window.__silavu && document.getElementById("tsend").click()); await p.waitForTimeout(300);
  out[lang].tsend = await p.$eval("#fMsg", e=>e.value);
  await p.close();
}
console.log(JSON.stringify(out,null,1)); await b.close();
