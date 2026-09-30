import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--disable-background-networking","--disable-component-update"] });
const ctx = await b.newContext({ viewport:{width:360,height:740}, hasTouch:true, isMobile:true, deviceScaleFactor:2 });
await ctx.addInitScript(() => { localStorage.setItem("silavu-lang", "he"); localStorage.setItem("silavu-seen","1"); });
const p = await ctx.newPage(); await p.route(/fonts\./, r=>r.abort());
await p.goto("http://127.0.0.1:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(600);
for (let i=0;i<4;i++) { await p.evaluate(()=>scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(500); }
console.log(await p.evaluate(()=>{ const last=[...document.querySelectorAll("#end a")].filter(e=>e.offsetParent).pop(); const r=last.getBoundingClientRect(), t=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2); return { last: last.outerHTML.slice(0,120), r:[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)], top: t && (t.id||t.className||t.tagName), topHtml: t && t.outerHTML.slice(0,140), vh: innerHeight }; }));
await p.screenshot({ path:"/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/foot360.png" });
await b.close();
