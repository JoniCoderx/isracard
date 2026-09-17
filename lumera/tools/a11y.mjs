import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const mob = process.argv[2]!=="desk";
const p = await b.newPage({ viewport: mob?{width:390,height:844}:{width:1440,height:900}, isMobile:mob, hasTouch:mob });
const errs=[]; p.on("pageerror",e=>errs.push(String(e).slice(0,100)));
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
await p.waitForTimeout(3000); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
await p.waitForTimeout(800);
const ok=(n,v,d)=>console.log((v?"PASS ":"FAIL ")+n+(d?"  ("+d+")":""));

// keyboard reaches controls and focus is visible
await p.keyboard.press("Tab"); await p.keyboard.press("Tab"); await p.waitForTimeout(200);
const f = await p.evaluate(()=>{const a=document.activeElement; if(!a||a===document.body) return null;
  const cs=getComputedStyle(a); return {tag:a.tagName, outline:cs.outlineStyle+" "+cs.outlineWidth, shadow:cs.boxShadow.slice(0,40)};});
ok("Tab moves focus to a control", !!f, f?f.tag:"nothing focused");
ok("focus is visible", !!f && (f.outline!=="none 0px" || /rgb/.test(f.shadow)), f?("outline="+f.outline+" shadow="+f.shadow):"-");

// ESC closes an open modal and scroll is released
const r = await p.evaluate(async ()=>{
  if (window.__tryon) window.__tryon.open();
  await new Promise(r=>setTimeout(r,900));
  return {opened:!!document.querySelector(".modal.open"), locked:document.documentElement.classList.contains("locked")};
});
ok("a modal opens and locks the page", r.opened && r.locked, "open="+r.opened+" locked="+r.locked);
await p.keyboard.press("Escape"); await p.waitForTimeout(900);
const r2 = await p.evaluate(()=>({open:!!document.querySelector(".modal.open"), locked:document.documentElement.classList.contains("locked")}));
ok("Escape closes it", !r2.open, "stillOpen="+r2.open);
ok("the scroll lock is released", !r2.locked, "locked="+r2.locked);
const y0=await p.evaluate(()=>scrollY); await p.evaluate(()=>window.scrollBy(0,400)); await p.waitForTimeout(400);
ok("the page scrolls again", await p.evaluate(()=>scrollY)!==y0);

// no dead links, no empty hrefs
const dead = await p.evaluate(()=>{
  const bad=[]; document.querySelectorAll("a").forEach(a=>{
    const h=a.getAttribute("href");
    if(h===null||h===""||h==="#") bad.push((a.textContent||"?").trim().slice(0,20)+" href="+JSON.stringify(h));
    else if(h.startsWith("#")&&h.length>1&&!document.getElementById(h.slice(1))) bad.push((a.textContent||"?").trim().slice(0,20)+" -> missing "+h);
  }); return bad;
});
ok("no empty or dangling links", dead.length===0, dead.length?dead.slice(0,4).join(" | "):"all resolve");

// every input is labelled
const unl = await p.evaluate(()=>{
  const bad=[]; document.querySelectorAll("input:not([type=hidden]), textarea, select").forEach(i=>{
    const has = (i.id && document.querySelector('label[for="'+i.id+'"]')) || i.getAttribute("aria-label") || i.closest("label");
    if(!has) bad.push(i.id||i.name||i.type);
  }); return bad;
});
ok("every field has a label", unl.length===0, unl.length?unl.join(", "):"all labelled");
console.log("\nerrors="+errs.length+(errs.length?" :: "+errs[0]:""));
await b.close();
