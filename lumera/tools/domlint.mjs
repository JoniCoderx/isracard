import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
for (const [w,h,mot] of [[1440,900,"no-preference"],[390,844,"reduce"]]) {
const ctx = await b.newContext({ viewport:{width:w,height:h}, reducedMotion: mot });
await ctx.addInitScript(() => { localStorage.setItem("silavu-seen","1"); });
const p = await ctx.newPage(); const errs=[]; p.on("pageerror", e=>errs.push(e.message));
await p.goto("http://127.0.0.1:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(800);
const H = await p.evaluate(()=>document.documentElement.scrollHeight);
for (let y=0;y<H;y+=700){ await p.evaluate(y=>scrollTo(0,y),y); await p.waitForTimeout(80); }
const r = await p.evaluate(() => {
  const ids={}; document.querySelectorAll("[id]").forEach(e=>ids[e.id]=(ids[e.id]||0)+1);
  const dup=Object.entries(ids).filter(([k,v])=>v>1).map(([k])=>k);
  const noname=[...document.querySelectorAll("button,a[href],[role=button],[role=tab]")].filter(e=>{ const s=getComputedStyle(e); if(s.display==="none"||e.closest("[hidden]")) return false; return !(e.getAttribute("aria-label")||e.textContent.trim()||e.getAttribute("title")||e.querySelector("img[alt]:not([alt=''])")); }).map(e=>e.outerHTML.slice(0,90));
  const noalt=[...document.images].filter(i=>!i.hasAttribute("alt")).map(i=>i.outerHTML.slice(0,80));
  const hs=[...document.querySelectorAll("h1,h2,h3,h4")].filter(h=>h.offsetParent).map(h=>+h.tagName[1]); let skip=0; for(let i=1;i<hs.length;i++) if(hs[i]-hs[i-1]>1) skip++;
  const h1=document.querySelectorAll("h1").length;
  const hidden_rv=[...document.querySelectorAll(".rv")].filter(e=>e.offsetParent && +getComputedStyle(e).opacity<0.05 && e.getBoundingClientRect().bottom< scrollY+innerHeight).length;
  const rvs=[...document.querySelectorAll(".rv")].filter(e=>e.offsetParent && +getComputedStyle(e).opacity<0.05).map(e=>(e.id||e.className)+" "+e.textContent.trim().slice(0,30)); return { rvs, noname:noname.slice(0,8), nNoname:noname.length, noalt:noalt.slice(0,5), headingSkips:skip, h1, invisibleRv:hidden_rv, lang:document.documentElement.lang };
});
console.log(w, mot, JSON.stringify(r), "errors", errs);
await ctx.close(); }
await b.close();
