import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
const ctx = await b.newContext({ viewport:{width:1440,height:900} }); await ctx.addInitScript(() => { localStorage.setItem("silavu-seen","1"); });
const p = await ctx.newPage(); await p.goto("http://127.0.0.1:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn").catch(()=>{});
for (const sel of ["#collection .acts .btn", "#bespoke .jfoot .btn, #bespoke .btn"]) {
  await p.evaluate(s=>{ const e=document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top+scrollY-450); }, sel); await p.waitForTimeout(1500);
  console.log(sel, await p.evaluate(s=>{ const e=document.querySelector(s), c=getComputedStyle(e); return [document.body.classList.contains("onivory"), c.backgroundColor, c.color, c.borderColor, e.textContent.trim()].join(" | "); }, sel));
  const e = await p.$(sel); await e.screenshot({ path:"/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/ivbtn-"+(sel.startsWith("#c")?"c":"b")+".png" });
}
await b.close();
