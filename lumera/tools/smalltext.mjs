import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--disable-background-networking","--disable-component-update"] });
const W = +(process.argv[2]||390), lang = process.argv[3]||"en";
const ctx = await b.newContext({ viewport:{width:W,height:844}, hasTouch:true, isMobile:true, deviceScaleFactor:2 });
await ctx.addInitScript(l => { localStorage.setItem("silavu-lang", l); localStorage.setItem("silavu-seen","1"); }, lang);
const p = await ctx.newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/, r=>r.abort());
await p.goto("http://127.0.0.1:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(500);
const H = await p.evaluate(()=>document.documentElement.scrollHeight);
for (let y=0;y<H;y+=700){ await p.evaluate(y=>scrollTo(0,y),y); await p.waitForTimeout(60); }
const res = await p.evaluate(() => {
  const out = {};
  for (const e of document.querySelectorAll("body *")) {
    if (!e.childNodes.length || ![...e.childNodes].some(n=>n.nodeType===3 && n.textContent.trim())) continue;
    const s = getComputedStyle(e); if (s.display==="none"||s.visibility==="hidden") continue;
    if (e.closest("[hidden], .modal:not(.open), #intro, svg, script, style, noscript")) continue;
    const r = e.getBoundingClientRect(); if (!r.width) continue;
    const fs = parseFloat(s.fontSize); if (fs >= 12) continue;
    const key = (e.id?"#"+e.id:"") + (typeof e.className==="string" && e.className ? "."+e.className.trim().split(/\s+/).slice(0,2).join(".") : "") + "<" + (e.parentElement && (e.parentElement.id || (e.parentElement.className+"").split(" ")[0])) + ">";
    (out[key] = out[key] || { fs, t: e.textContent.trim().slice(0,30), n:0 }).n++;
  }
  return out;
});
const keys = Object.keys(res); console.log(W, lang, "elements under 12px:", keys.length);
for (const k of keys.slice(0,60)) console.log(" ", res[k].fs.toFixed(1)+"px", k, JSON.stringify(res[k].t), "×"+res[k].n);
await b.close();
