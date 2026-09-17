import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });
await p.addInitScript(()=>{ window.__raf=0; const o=window.requestAnimationFrame;
  window.requestAnimationFrame=function(f){ window.__raf++; return o.call(window,f); }; });
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
await p.waitForTimeout(3000); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
await p.waitForTimeout(1500);
const ok=(n,v,d)=>console.log((v?"PASS ":"FAIL ")+n+(d?"  ("+d+")":""));

// 3D is not built until the builder is approached
const before3d = await p.evaluate(()=>({built:!!(window.__bracelet && window.__bracelet.built), cvW:(document.getElementById("bcv")||{}).width||0}));
// rAF rate while sitting at the top, nowhere near the 3D
let a = await p.evaluate(()=>window.__raf); await p.waitForTimeout(2000);
let b1 = await p.evaluate(()=>window.__raf);
const idleTop = b1-a;

await p.evaluate(()=>{const e=document.getElementById("build");e&&window.scrollTo({top:scrollY+e.getBoundingClientRect().top,behavior:"instant"});});
await p.waitForTimeout(700);
await p.evaluate(()=>{const t=[...document.querySelectorAll("#build a,#build button")].find(e=>/START DESIGNING/i.test(e.textContent));t&&t.click();});
await p.waitForTimeout(5000);
let c = await p.evaluate(()=>window.__raf); await p.waitForTimeout(2000);
let d = await p.evaluate(()=>window.__raf);
const atBuilder = d-c;

// scroll far away and see whether it keeps drawing
await p.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));
await p.waitForTimeout(2500);
let e1 = await p.evaluate(()=>window.__raf); await p.waitForTimeout(2500);
let f1 = await p.evaluate(()=>window.__raf);
const awayAgain = f1-e1;

console.log("animation frames requested per 2s:");
console.log("   before the 3D exists : "+idleTop);
console.log("   at the builder       : "+atBuilder);
console.log("   scrolled away again  : "+Math.round(awayAgain*0.8));
ok("the 3D is idle before you reach it", before3d.cvW===0 || idleTop < atBuilder, "canvas="+before3d.cvW+"px idle="+idleTop);
ok("it quietens once it is offscreen", Math.round(awayAgain*0.8) < atBuilder, "away="+Math.round(awayAgain*0.8)+" vs builder="+atBuilder);
console.log("\nWebGL fallback present: "+await p.evaluate(()=>{
  const w=document.getElementById("stripwrap"); return w? (w.className+" | canvas="+!!document.getElementById("bcv")) : "-";}));
await b.close();
