import { chromium } from "playwright-core";
const OUT="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--disable-background-networking","--disable-component-update","--no-first-run"] });
for (const [w,h,lang] of (process.argv[2]?JSON.parse(process.argv[2]):[[1440,900,"he"]])) {
  const ctx = await b.newContext({ viewport:{width:w,height:h} });
  await ctx.addInitScript(l => { localStorage.setItem("silavu-lang", l); localStorage.setItem("silavu-seen","1"); }, lang);
  const p = await ctx.newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/, r=>r.abort()); await p.goto("http://127.0.0.1:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(500);
  await p.evaluate(()=>{ const e=document.getElementById("concierge"); scrollTo(0, e.getBoundingClientRect().top+scrollY-(innerWidth>999?72:0)); }); await p.waitForTimeout(7000); console.log(await p.evaluate(()=>[...document.querySelectorAll("#concierge .rv")].map(e=>e.className.split(" ").slice(0,2).join(".")+"="+getComputedStyle(e).opacity).join(" ")));
  const r = await p.evaluate(()=>{ const f=document.getElementById("cform").getBoundingClientRect(); return [Math.round(f.left), Math.round(f.right)]; });
  console.log(w, lang, "form x", r);
  await p.screenshot({ path: OUT+`form-${w}-${lang}.png` }); await ctx.close();
}
await b.close();
