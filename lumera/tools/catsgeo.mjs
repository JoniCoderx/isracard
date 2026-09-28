import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [W,H] of [[390,844],[768,1024],[1440,900]]) {
  const p = await b.newPage({ viewport:{width:W,height:H}, isMobile:W<900, hasTouch:W<900, deviceScaleFactor:1, reducedMotion:"reduce" });
  await p.goto("http://127.0.0.1:8777/", { waitUntil:"domcontentloaded" });
  await p.waitForTimeout(2500); await p.click("#enterBtn",{timeout:6000}).catch(()=>{});
  await p.waitForTimeout(800);
  await p.evaluate(async()=>{const s=Math.round(innerHeight*0.7);for(let y=0;y<document.body.scrollHeight;y+=s){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,110));}});
  await p.evaluate(()=>document.getElementById("collection").scrollIntoView({block:"start",behavior:"instant"}));
  await p.waitForTimeout(500);
  console.log(W, await p.evaluate(()=>{
    const c=document.querySelector(".cats"); if(!c) return "absent";
    const b=c.getBoundingClientRect(); const cs=getComputedStyle(c);
    const kids=[...c.children].map(e=>{const r=e.getBoundingClientRect();return {t:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height),txt:e.textContent.trim()};});
    const lines=new Set(kids.map(k=>k.t)).size;
    return `cats ${Math.round(b.width)}x${Math.round(b.height)} lines=${lines} wrap=${cs.flexWrap} gap=${cs.gap} | ` + kids.map(k=>`${k.txt} ${k.w}x${k.h}`).join("  ");
  }));
  await p.close();
}
await b.close();
