/* What sits on top of the piece? Reports every control inside the strip and
   how much of it overlaps the drawn bracelet's own bounding box. */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const W = Number(process.argv[2]||390), H = Number(process.argv[3]||844);
const p = await b.newPage({ viewport: { width: W, height: H }, isMobile: W<900, hasTouch: W<900, deviceScaleFactor: 1, reducedMotion: "reduce" });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600); await p.click("#enterBtn").catch(()=>{});
await p.waitForTimeout(900);
await p.evaluate(async()=>{const s=Math.round(innerHeight*0.7);for(let y=0;y<document.body.scrollHeight;y+=s){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,120));}});
await p.evaluate(()=>{const e=document.getElementById("configure");scrollTo({top:e.getBoundingClientRect().top+scrollY-60,behavior:"instant"});});
await p.waitForTimeout(1500);
const r = await p.evaluate(() => {
  const strip = document.getElementById("stripwrap").getBoundingClientRect();
  const cv = document.getElementById("bcv");
  const c2 = document.createElement("canvas"); c2.width = cv.width; c2.height = cv.height;
  const g = c2.getContext("2d");
  let art = null;
  try { g.drawImage(cv, 0, 0);
    const d = g.getImageData(0,0,c2.width,c2.height).data;
    let x0=c2.width,x1=-1,y0=c2.height,y1=-1;
    for (let y=0;y<c2.height;y++) for (let x=0;x<c2.width;x++) {
      const i=(y*c2.width+x)*4;
      if (d[i+3] > 24 && (d[i]+d[i+1]+d[i+2]) > 90) { if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
    }
    if (x1 > 0) { const sx = strip.width/c2.width, sy = strip.height/c2.height;
      art = { left: strip.left + x0*sx, right: strip.left + x1*sx, top: strip.top + y0*sy, bottom: strip.top + y1*sy }; }
  } catch(e) { art = null; }
  const out = [];
  for (const sel of [".vt", ".stbtn", ".vmark", ".sthint", ".vhint"]) {
    const e = document.querySelector("#stripwrap " + sel); if (!e) { out.push(`${sel}: absent`); continue; }
    const c = getComputedStyle(e); if (c.display === "none" || +c.opacity < 0.05) { out.push(`${sel}: hidden`); continue; }
    const b = e.getBoundingClientRect();
    let ov = 0;
    if (art) { const w = Math.max(0, Math.min(b.right,art.right) - Math.max(b.left,art.left));
      const hh = Math.max(0, Math.min(b.bottom,art.bottom) - Math.max(b.top,art.top)); ov = w*hh; }
    out.push(`${sel}: ${Math.round(b.width)}x${Math.round(b.height)} at (${Math.round(b.left-strip.left)},${Math.round(b.top-strip.top)})  covers ${Math.round(ov)}px² of the piece`);
  }
  return { strip: `${Math.round(strip.width)}x${Math.round(strip.height)}`,
    art: art ? `x ${Math.round(art.left-strip.left)}..${Math.round(art.right-strip.left)} y ${Math.round(art.top-strip.top)}..${Math.round(art.bottom-strip.top)}` : "could not read the canvas",
    out };
});
console.log(`${W}x${H} strip ${r.strip}\n  piece: ${r.art}`);
r.out.forEach(l=>console.log("  "+l));
await b.close();
