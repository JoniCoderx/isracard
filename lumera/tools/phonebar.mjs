/* How much of the phone's builder is picture and how much is furniture. */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [w,h] of [[390,844],[320,568]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2400); await p.click("#enterBtn").catch(()=>{});
  await p.waitForTimeout(800);
  await p.evaluate(async()=>{const s=Math.round(innerHeight*0.7);for(let y=0;y<document.body.scrollHeight;y+=s){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,110));}});
  await p.evaluate(()=>{const e=document.getElementById("configure");scrollTo({top:e.getBoundingClientRect().top+scrollY-60,behavior:"instant"});});
  await p.waitForTimeout(400);
  await p.evaluate(()=>window.__stripView("wrist"));
  await p.waitForTimeout(2500);
  const r = await p.evaluate(()=>{
    const g=s=>{const e=document.querySelector(s); if(!e) return null; const b=e.getBoundingClientRect(); return {h:Math.round(b.height),w:Math.round(b.width)};};
    const sk=document.querySelector("#handbar .sk"); const skb=sk&&sk.getBoundingClientRect();
    const reach=(()=>{ if(!sk) return 0; const a=getComputedStyle(sk,"::after"); return a.width; })();
    const vp=document.querySelector("#handbar .vp"); const vpb=vp&&vp.getBoundingClientRect();
    return { strip:g("#stripwrap"), bar:g("#handbar"), swatch: skb?Math.round(skb.width)+"x"+Math.round(skb.height):null,
      swatchReach: reach, pill: vpb?Math.round(vpb.width)+"x"+Math.round(vpb.height):null,
      configure:g("#configure") };
  });
  console.log(`${w}x${h}  picture ${r.strip.w}x${r.strip.h}   bar ${r.bar.h}px (${(r.bar.h/r.strip.h*100).toFixed(0)}% of the picture)   swatch ${r.swatch} reach ${r.swatchReach}   pill ${r.pill}   builder ${r.configure.h}px`);
  await p.close();
}
await b.close();
