import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [n,w,h,mob] of [["desk",1440,900,false],["mob",390,844,true]]) {
  const p = await b.newPage({ viewport:{width:w,height:h}, isMobile:mob, hasTouch:mob });
  await p.addInitScript(()=>{ window.__lt=[]; try{ new PerformanceObserver(l=>{ l.getEntries().forEach(e=>window.__lt.push(Math.round(e.startTime)+"ms for "+Math.round(e.duration)+"ms")); }).observe({entryTypes:["longtask"]}); }catch(e){} });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html?intro=1",{waitUntil:"load"});
  await p.waitForTimeout(5000);
  const r = await p.evaluate(()=>({ lt:window.__lt||[], 
    blocked:(window.__lt||[]).reduce((a,s)=>a+ +(s.split("for ")[1]||"0").replace("ms",""),0),
    nav:(()=>{const e=performance.getEntriesByType("navigation")[0];return e?{dcl:Math.round(e.domContentLoadedEventEnd),load:Math.round(e.loadEventEnd)}:null;})() }));
  console.log("\n"+n+": DOMContentLoaded="+ (r.nav?r.nav.dcl:"?") +"ms  load="+(r.nav?r.nav.load:"?")+"ms");
  console.log("  total main-thread blocked: "+r.blocked+"ms across "+r.lt.length+" long tasks");
  r.lt.slice(0,8).forEach(t=>console.log("    "+t));
  await p.close();
}
await b.close();
