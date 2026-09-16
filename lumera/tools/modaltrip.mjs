import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [n,w,h,mob] of [["mob",390,844,true],["desk",1440,900,false]]) {
  const p = await b.newPage({ viewport:{width:w,height:h}, isMobile:mob, hasTouch:mob });
  const errs=[]; p.on("pageerror",e=>errs.push(String(e).slice(0,140)));
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
  await p.waitForTimeout(3000); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
  await p.waitForTimeout(800);
  console.log("\n=== "+n+" ===");
  const locked = () => p.evaluate(()=>document.documentElement.classList.contains("locked"));
  const canScroll = async () => { const y0=await p.evaluate(()=>scrollY); await p.evaluate(()=>window.scrollBy(0,500)); await p.waitForTimeout(350); const y1=await p.evaluate(()=>scrollY); await p.evaluate(y=>window.scrollTo(0,y),y0); return y1!==y0; };
  console.log("baseline scroll works: "+await canScroll()+" locked="+await locked());
  // every opener we can find
  const openers = await p.evaluate(()=>[...document.querySelectorAll('[data-piece],[data-partner],#pmTry,.hbook,[data-modal]')].map((e,i)=>({i,tag:e.tagName,txt:(e.textContent||"").trim().slice(0,26)})).slice(0,8));
  for (const o of openers) {
    const opened = await p.evaluate(i=>{ const e=[...document.querySelectorAll('[data-piece],[data-partner],#pmTry,.hbook,[data-modal]')][i];
      if(!e) return "gone"; const cs=getComputedStyle(e); if(cs.display==="none") return "hidden"; e.click(); return "clicked"; }, o.i);
    await p.waitForTimeout(1300);
    const open = await p.evaluate(()=>{ const m=document.querySelector(".modal.open"); return m?(m.id||m.className):"none"; });
    // close it the way a person would
    await p.evaluate(()=>{ const m=document.querySelector(".modal.open"); if(!m) return; const c=m.querySelector(".mclose,.mclose2,[data-close]"); if(c) c.click(); });
    await p.waitForTimeout(900);
    await p.keyboard.press("Escape").catch(()=>{});
    await p.waitForTimeout(600);
    const stillOpen = await p.evaluate(()=>{ const m=document.querySelector(".modal.open"); return m?(m.id||m.className):"none"; });
    const sc = await canScroll();
    const bad = (stillOpen!=="none") || !sc;
    console.log((bad?"BAD  ":"ok   ")+o.txt.padEnd(26)+" open="+open+" afterClose="+stillOpen+" scrolls="+sc+" locked="+await locked());
  }
  console.log("errors="+errs.length+(errs.length?" :: "+errs[0]:""));
  await p.close();
}
await b.close();
