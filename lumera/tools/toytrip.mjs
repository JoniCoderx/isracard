import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [n,w,h,mob] of [["desk",1440,900,false],["mob",390,844,true]]) {
  const p = await b.newPage({ viewport:{width:w,height:h}, isMobile:mob, hasTouch:mob });
  const errs=[]; p.on("pageerror",e=>errs.push(String(e).slice(0,140)));
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
  await p.waitForTimeout(3000); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
  await p.evaluate(()=>{ const e=document.getElementById("build"); window.scrollTo({top:scrollY+e.getBoundingClientRect().top,behavior:"instant"}); });
  await p.waitForTimeout(800);
  await p.evaluate(()=>{ const t=[...document.querySelectorAll("#build a,#build button")].find(e=>/START DESIGNING/i.test(e.textContent)); t&&t.click(); });
  await p.waitForTimeout(5000);
  console.log("\n=== "+n+" ===");
  const state = () => p.evaluate(()=>{
    const w=document.getElementById("stripwrap"), cv=document.getElementById("bcv");
    const r=cv.getBoundingClientRect(); const c=getComputedStyle(cv);
    const vis=(s)=>{const e=document.querySelector(s); if(!e) return "missing"; const cs=getComputedStyle(e); return (cs.display!=="none"&&cs.visibility!=="hidden")?"shown":"hidden";};
    return {play:document.documentElement.classList.contains("silavu-play"), held:w.classList.contains("held"),
      pos:c.position, cvW:Math.round(r.width),
      up:vis('[data-toy="up"]'), carry:vis('[data-toy="carry"]'), down:vis('[data-toy="down"]'), playbar:vis('#playbar')};
  });
  const click = async (s) => { const ok = await p.evaluate(sel=>{ const e=[...document.querySelectorAll(sel)].find(x=>{const c=getComputedStyle(x);return c.display!=="none"&&c.visibility!=="hidden";}); if(!e) return false; e.click(); return true; }, s); await p.waitForTimeout(1600); return ok; };
  console.log("rest     : "+JSON.stringify(await state()));
  console.log("pickUp ok="+await click('[data-toy="up"]'));
  console.log("held     : "+JSON.stringify(await state()));
  console.log("carry  ok="+await click('[data-toy="carry"]'));
  console.log("carrying : "+JSON.stringify(await state()));
  console.log("putBack ok="+await click('#playbar [data-toy="down"], [data-toy="down"]'));
  console.log("back     : "+JSON.stringify(await state()));
  // and the wrist tab
  const tab = await p.evaluate(()=>{ const t=[...document.querySelectorAll(".vtb")].find(e=>/wrist/i.test(e.textContent)); if(!t) return "no tab"; t.click(); return "clicked"; });
  await p.waitForTimeout(2500);
  console.log("wrist tab "+tab+" -> "+await p.evaluate(()=>{const w=document.getElementById("stripwrap"); const s=document.getElementById("stripcv"); const r=s?s.getBoundingClientRect():null; return "wristCls="+w.classList.contains("wrist")+" stripcv="+(r?Math.round(r.width)+"x"+Math.round(r.height):"-");}));
  console.log("errors="+errs.length+(errs.length?" :: "+errs[0]:""));
  await p.close();
}
await b.close();
