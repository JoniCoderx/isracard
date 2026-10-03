import { chromium } from "playwright-core";
/* the card gallery and the piece window, by mouse and by finger */
const port=process.argv[2]||"8777"; let pass=0, fail=0;
const ok=(c,m)=>{ console.log((c?"PASS ":"FAIL ")+m); c?pass++:fail++; };
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
async function open(w,h,mob,lang){ const c=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
  if (lang) await c.addInitScript(l=>{try{localStorage.setItem("silavu-lang",l)}catch(e){}},lang);
  const p=await c.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto(`http://localhost:${port}/`,{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn",{timeout:1500}).catch(()=>{}); await p.waitForTimeout(400);
  await p.evaluate(()=>document.documentElement.style.scrollBehavior="auto"); p.errs=errs; return p; }
const state=p=>p.evaluate(()=>({open:document.getElementById("pmodal").classList.contains("open"), t:(document.getElementById("pmT").textContent||"").replace(/\s+/g," ").trim(), at:[...document.querySelectorAll(".pgrid .piece:not(.soon)")].map(x=>x.__at||0), th:[...document.querySelectorAll("#pmThumbs [data-i]")].findIndex(x=>x.classList.contains("on")), y:Math.round(scrollY), focus:document.activeElement&&document.activeElement.className}));
/* ── desktop ── */
{ const p=await open(1440,900,false); const cards=p.locator(".pgrid .piece:not(.soon)"); const n=await cards.count();
  for (let i=0;i<n;i++) { const c=cards.nth(i); await c.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
    const name=(await c.locator(".t").textContent()).replace(/\s+/g," ").trim();
    await c.locator(".vw").click(); await p.waitForTimeout(700); let s=await state(p);
    ok(s.open && s.t===name, `desktop card ${i}: View the piece opens "${name}" (got "${s.t}")`);
    await p.keyboard.press("Escape"); await p.waitForTimeout(400); s=await state(p);
    ok(!s.open && /vw/.test(s.focus||""), `desktop card ${i}: Escape closes, focus back on View (${s.focus})`);
    await c.locator(".fig").click({position:{x:60,y:60}}); await p.waitForTimeout(700); s=await state(p);
    ok(s.open && s.t===name, `desktop card ${i}: the photograph opens the same piece`);
    await p.keyboard.press("Escape"); await p.waitForTimeout(400); }
  const c=cards.first(); await c.scrollIntoViewIfNeeded(); await c.hover(); await p.waitForTimeout(300);
  await c.locator(".cnext").click(); await p.waitForTimeout(600); let s=await state(p);
  ok(!s.open && s.at[0]>=1, `desktop arrow changes the photograph without opening (at ${s.at[0]})`);
  const want=s.at[0]; await c.locator(".fig").click({position:{x:80,y:80}}); await p.waitForTimeout(800); s=await state(p);
  ok(s.open && s.th===want, `desktop window opens on the card's photograph (${s.th} = ${want})`);
  await p.click("#pmNext"); await p.waitForTimeout(400); s=await state(p); const last=s.th;
  await p.keyboard.press("Escape"); await p.waitForTimeout(500); s=await state(p);
  ok(s.at[0]===last, `desktop card keeps the photograph last seen in the window (${s.at[0]} = ${last})`);
  ok(!p.errs.length, "desktop no page errors "+p.errs.join("|")); await p.context().close(); }
/* ── phone ── */
for (const lang of ["en","he"]) { const p=await open(390,844,true,lang); const cdp=await p.context().newCDPSession(p);
  const c=p.locator(".pgrid .piece:not(.soon)").first(); await c.scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  const box=await c.locator(".fig").boundingBox(); const cx=box.x+box.width/2, cy=box.y+box.height/2;
  async function swipe(dx,dy){ await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:cx,y:cy}]});
    for (let k=1;k<=8;k++) await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:cx+dx*k/8,y:cy+dy*k/8}]});
    await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]}); await p.waitForTimeout(700); }
  let s0=await state(p); await swipe(lang==="he"?120:-120,4); let s=await state(p);
  ok(!s.open && s.at[0]===1, `${lang} phone swipe changes the photograph (at ${s.at[0]}), no window`);
  await swipe(lang==="he"?-120:120,4); s=await state(p);
  ok(!s.open && s.at[0]===0, `${lang} phone swipe back (at ${s.at[0]})`);
  const y1=await p.evaluate(()=>scrollY);
  await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:cx,y:cy}]});
  for (let k=1;k<=12;k++){ await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:cx+k,y:cy-k*20}]}); await p.waitForTimeout(16); }
  await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]}); await p.waitForTimeout(700);
  const y2=await p.evaluate(()=>scrollY); s=await state(p);
  ok(y2-y1>150 && !s.open && s.at[0]===0, `${lang} phone vertical drag on the photograph scrolls the page (${y2-y1}px)`);
  await c.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await swipe(lang==="he"?120:-120,4);
  const yb=await p.evaluate(()=>scrollY);
  await c.locator(".fig").tap(); await p.waitForTimeout(900); s=await state(p);
  ok(s.open && s.th===1, `${lang} phone tap opens the window on the photograph shown (${s.th})`);
  const mb=await p.evaluate(()=>{const r=document.querySelector("#pmodal .mbox").getBoundingClientRect(); return [Math.round(r.width),Math.round(r.height)];});
  ok(mb[0]>=360 && mb[1]>=780, `${lang} phone window is near full screen (${mb})`);
  await p.locator("#pmodal .mclose2").tap(); await p.waitForTimeout(700); s=await state(p);
  ok(!s.open && Math.abs(s.y-yb)<4, `${lang} phone close returns to the same place (${s.y} vs ${yb})`);
  const vwv=await c.locator(".vw").isVisible(); ok(vwv, `${lang} phone "View the piece" is visible`);
  await c.locator(".vw").tap(); await p.waitForTimeout(800); s=await state(p); ok(s.open, `${lang} phone View the piece opens the window`);
  ok(!p.errs.length, `${lang} phone no page errors `+p.errs.join("|")); await p.context().close(); }
console.log(`${pass} pass, ${fail} fail`); await b.close();
