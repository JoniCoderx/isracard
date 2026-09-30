import { chromium } from "playwright-core";
const OUT="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--disable-background-networking","--disable-component-update"] });
for (const [W,H,lang] of [[1440,900,"en"],[1024,768,"he"]]) {
const ctx = await b.newContext({ viewport:{width:W,height:H} }); await ctx.addInitScript(l=>{localStorage.setItem("silavu-lang",l);localStorage.setItem("silavu-seen","1");},lang);
const p = await ctx.newPage(); await p.route(/fonts\./, r=>r.abort()); await p.goto("http://127.0.0.1:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(800);
for (const [sel,name,off] of [[".excep","excep",0.08],["#certs","certs",0.6],["#house","house",0]]) {
  await p.evaluate(([s,o])=>{ const e=document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top+scrollY-innerHeight*o); }, [sel,off]); await p.waitForTimeout(1800);
  await p.screenshot({ path: OUT+`fix-${name}-${W}-${lang}.png` });
}
console.log(W, await p.evaluate(()=>{ const e=document.querySelector("#house .k.gold"); const s=getComputedStyle(e); return s.color+" op="+s.opacity+" fs="+s.fontSize; }));
await ctx.close(); }
await b.close();
