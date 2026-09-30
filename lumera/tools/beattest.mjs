import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
let pass=0, fail=0; const ok=(c,m)=>{ c?pass++:fail++; console.log((c?"PASS ":"FAIL ")+m); };
for (const [w,h,lang] of [[1440,900,"he"],[390,844,"he"],[1280,760,"en"]]) {
  const ctx = await b.newContext({ viewport:{width:w,height:h} });
  await ctx.addInitScript(l => { localStorage.setItem("silavu-lang", l); localStorage.setItem("silavu-seen","1"); }, lang);
  const p = await ctx.newPage(); await p.goto("http://127.0.0.1:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(500);
  const [y0,y1] = await p.evaluate(()=>{ const e=document.getElementById("stonepin"), r=e.getBoundingClientRect(); return [r.top+scrollY, r.top+scrollY+r.height-innerHeight]; });
  let worst = 0, empty = 0, samples = 0, bad = [];
  const pts = []; for (let k=0;k<=24;k++) pts.push(y0+(y1-y0)*k/24); const back = [...pts].reverse();
  for (const [dir, list] of [["down",pts],["up",back]]) for (const y of list) {
    await p.evaluate(y=>scrollTo(0,y), Math.round(y)); await p.waitForTimeout(900);
    const v = await p.evaluate(()=>[...document.querySelectorAll("#beats .beat")].map(b=>+getComputedStyle(b).opacity));
    const on = v.filter(o=>o>0.04).length; samples++; if (on>1) bad.push(dir+"@"+Math.round((y-y0)/(y1-y0)*100)+"% "+v.map(o=>o.toFixed(2)).join("/")); if (on===0 || Math.max(...v)<0.95) empty++;
  }
  ok(bad.length===0 && empty===0, `${w} ${lang}: ${samples} stops down and back up, never two stages at once ${bad.slice(0,3).join(" ")}; stops without one fully readable stage: ${empty}`);
  // a stop exactly between stage 1 and 2 (the reported spot)
  await p.evaluate(([a,b])=>scrollTo(0, a+(b-a)*(1/3)), [y0,y1]); await p.waitForTimeout(600);
  await p.screenshot({ path:`/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/beat-${w}-${lang}.png` });
  await ctx.close();
}
console.log(`\n${pass} pass, ${fail} fail`); await b.close();
