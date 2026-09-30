import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--disable-background-networking","--disable-component-update"] });
for (const W of [360,390,430]) {
const ctx = await b.newContext({ viewport:{width:W,height:W===360?740:844}, hasTouch:true, isMobile:true, deviceScaleFactor:2 });
await ctx.addInitScript(() => { localStorage.setItem("silavu-lang","he"); localStorage.setItem("silavu-seen","1"); });
const p = await ctx.newPage(); await p.route(/fonts\./, r=>r.abort());
await p.goto("http://127.0.0.1:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(500);
const res=[];
for (const frac of [0.2,0.4,0.5,0.6,0.8]) {
  await p.evaluate(f=>{ const e=document.querySelector('.cur .chip'); const r=e.getBoundingClientRect(); scrollTo(0, scrollY + r.top - innerHeight*f); }, frac); await p.waitForTimeout(700);
  res.push(await p.evaluate(()=>[...document.querySelectorAll('.cur .chip, #reserve, #tryonBtn2')].map(e=>{ const r=e.getBoundingClientRect(); const t=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2); return (t && (t===e||e.contains(t))) ? "ok" : (e.textContent.trim()+"<"+(t&&(t.className||t.tagName))+">"); }).filter(x=>x!=="ok").join(",")));
}
console.log(W, JSON.stringify(res));
await ctx.close(); }
await b.close();
