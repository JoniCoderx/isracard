/* The wrist photograph opens: the window widens and the piece should come
   TOWARD you, not shrink away. Samples the frame's inset and the image's
   scale down the chapter and reports the direction of each. */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [W,H] of [[390,844],[1440,900]]) {
  const p = await b.newPage({ viewport:{width:W,height:H}, isMobile:W<900, hasTouch:W<900, deviceScaleFactor:1 });
  await p.goto("http://127.0.0.1:8777/", { waitUntil:"domcontentloaded" });
  await p.waitForTimeout(2500); await p.click("#enterBtn",{timeout:6000}).catch(()=>{});
  await p.waitForTimeout(800);
  await p.evaluate(async()=>{const s=Math.round(innerHeight*0.7);for(let y=0;y<document.body.scrollHeight;y+=s){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,110));}});
  const base = await p.evaluate(()=>{const e=document.querySelector(".wpin");return e.getBoundingClientRect().top+scrollY;});
  const rows=[];
  for (const f of [0,0.15,0.3,0.45,0.6,0.8,1]) {
    await p.evaluate(([b,f])=>{const e=document.querySelector(".wpin");const h=e.getBoundingClientRect().height;scrollTo({top:b+(h-innerHeight)*f,behavior:"instant"});},[base,f]);
    await p.waitForTimeout(420);
    rows.push(await p.evaluate(f=>{
      const fr=document.getElementById("wframe"), im=document.getElementById("wimg");
      const cp=getComputedStyle(fr).clipPath||"";
      const m=cp.match(/inset\(([\d.]+)%\s+([\d.]+)%/);
      const t=getComputedStyle(im).transform;
      let sc=1; const mm=t.match(/matrix\(([-\d.]+)/); if(mm) sc=parseFloat(mm[1]);
      const vis=im.getBoundingClientRect();
      return {f, inset: m?parseFloat(m[1]):null, scale:+sc.toFixed(3)};
    }, f));
  }
  const ins = rows.map(r=>r.inset), sc = rows.map(r=>r.scale);
  const opens = ins[0] > ins[ins.length-1];
  const grows = sc[sc.length-1] > sc[0];
  console.log(`${W}  inset ${ins.map(v=>v===null?"-":v.toFixed(1)).join(" -> ")}   ${opens?"frame OPENS":"frame CLOSES"}`);
  console.log(`      scale ${sc.join(" -> ")}   ${grows?"piece GROWS":"piece SHRINKS"}   ${opens&&grows?"SAME DIRECTION":"PULLING APART"}`);
  await p.close();
}
await b.close();
