import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [tag, vp] of [["desk",{width:1440,height:900}],["mob",{width:390,height:844}]]) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" });
  await p.waitForTimeout(3000); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
  await p.waitForTimeout(900);
  await p.evaluate(()=>{ const e=document.getElementById("build"); window.scrollTo({top: scrollY+e.getBoundingClientRect().top, behavior:"instant"}); });
  await p.waitForTimeout(1500);
  const ok = await p.evaluate(()=>{ const els=Array.from(document.querySelectorAll("#build a,#build button")); const t=els.find(e=>/START DESIGNING/i.test(e.textContent)); if(t){t.click();return true;} return false; });
  console.log(tag+" start designing clicked: "+ok);
  await p.waitForTimeout(9000);
  console.log(tag+" bcv: "+await p.evaluate(()=>{const c=document.getElementById("bcv"); if(!c)return "none"; const r=c.getBoundingClientRect(); return c.width+"x"+c.height+" rect "+Math.round(r.width)+"x"+Math.round(r.height)+"@"+Math.round(r.top);}));
  console.log(tag+" __b: "+await p.evaluate(()=>{ try { return JSON.stringify({n:window.__b&&window.__b.n, frames:window.__b&&window.__b.frames, built:window.__b&&window.__b.built}); } catch(e){ return "x"; } }));
  await p.screenshot({ path: `${OUT}/${tag}-build2.png` });
  const el = await p.$("#bcv"); if (el) await el.screenshot({ path: `${OUT}/${tag}-bcv.png` });
  await p.close();
}
await b.close();
