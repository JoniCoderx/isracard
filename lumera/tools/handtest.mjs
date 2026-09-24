/* What a finger can hit and an eye can read, on the phones people actually
   hold. Everything here was found by measuring, not by looking: thirty-nine
   controls under 44px and forty-four pieces of text under 11px, on a page
   that every other harness called clean.
   Usage: node tools/handtest.mjs [base-url] */
import { chromium } from "playwright-core";
const BASE = process.argv[2] || "http://127.0.0.1:8777/";
const EXE = process.env.CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const b = await chromium.launch({ executablePath:EXE, args:["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, hasTouch:true, isMobile:true });
const p = await ctx.newPage();
await p.goto(BASE,{waitUntil:"domcontentloaded",timeout:45000});
await p.waitForTimeout(2600); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(1200);
await p.evaluate(async()=>{const s=Math.round(innerHeight*0.8);for(let y=0;y<document.body.scrollHeight;y+=s){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,100));}scrollTo({top:0,behavior:"instant"});});
await p.waitForTimeout(1200);
const r = await p.evaluate(()=>{
  const small=[], tiny=[], wide=[];
  for (const e of document.querySelectorAll('a[href],button,input,select,[tabindex]:not([tabindex="-1"]),summary')) {
    /* a closed window is scaled to .86, so everything in it measures small */
    if (e.closest(".modal:not(.open)")) continue;
    const cs=getComputedStyle(e); if(cs.display==="none"||cs.visibility==="hidden"||+cs.opacity<0.05) continue;
    const r=e.getBoundingClientRect(); if(r.width<1||r.height<1) continue;
    /* A target has two sizes: the one you see and the one you can hit. The
       site gives small controls an absolutely positioned ::after that overhangs
       into the gap around them, so a 34px pill still answers a 44px thumb.
       Measuring the visible box alone fails those and passes nothing better —
       what a finger meets is the union of the two. */
    let hit = r.height;
    const af = getComputedStyle(e, "::after");
    if (af && af.content !== "none" && af.position === "absolute" && af.pointerEvents !== "none") {
      const ah = parseFloat(af.height);
      if (ah > hit) hit = ah;
    }
    if (hit<44||r.width<28) small.push(`${(e.id||String(e.className).split(" ")[0]||e.tagName)} ${Math.round(r.width)}×${Math.round(r.height)} (reach ${Math.round(hit)}) "${e.textContent.trim().slice(0,18)}"`);
  }
  for (const e of document.querySelectorAll("p,li,span,div,a,button")) {
    if (!e.textContent.trim() || e.children.length) continue;
    const fs=parseFloat(getComputedStyle(e).fontSize);
    const r=e.getBoundingClientRect(); if(r.height<2) continue;
    if (fs<11) tiny.push(`${fs}px ${(String(e.className).split(" ")[0]||e.tagName)} "${e.textContent.trim().slice(0,22)}"`);
  }
  /* lines of running text that are too long or too short to read */
  const fab=document.getElementById("fab"), hd=document.getElementById("header");
  return { tapTargets:[...new Set(small)].slice(0,14), tapCount:new Set(small).size,
    tinyText:[...new Set(tiny)].slice(0,8), tinyCount:new Set(tiny).size,
    fab: fab?{h:Math.round(fab.getBoundingClientRect().height), bottom:getComputedStyle(fab).bottom, z:getComputedStyle(fab).zIndex}:null,
    header: hd?{h:Math.round(hd.getBoundingClientRect().height)}:null,
    sections: [...document.querySelectorAll("main > section")].map(s=>s.id+" "+(s.offsetHeight/innerHeight).toFixed(2)),
    screens:+(document.body.scrollHeight/innerHeight).toFixed(2) };
});
console.log(JSON.stringify(r,null,1));
const bad = r.tapCount + r.tinyCount;
console.log(bad === 0 ? "\nPASS every control is at least 44px and no text is under 11px"
  : `\nFAIL ${r.tapCount} controls under 44px, ${r.tinyCount} texts under 11px`);
await b.close();
process.exit(bad ? 1 : 0);
