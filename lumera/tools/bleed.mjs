/* Does anything show through the sticky builder?
   Screenshots the strip's own rectangle at a scroll where the questions are
   passing behind it, then again with the questions hidden. If the two differ,
   the page is visible through the thing that is supposed to be covering it. */
import { chromium } from "playwright-core";
import { writeFileSync } from "node:fs";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: "reduce" });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600); await p.click("#enterBtn").catch(()=>{});
await p.waitForTimeout(900);
await p.evaluate(async()=>{const s=Math.round(innerHeight*0.7);for(let y=0;y<document.body.scrollHeight;y+=s){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,120));}});
const base = await p.evaluate(()=>document.getElementById("configure").getBoundingClientRect().top+scrollY);
const OFFS = [200, 450, 700, 950, 1200];
for (const off of OFFS) {
await p.evaluate(v=>scrollTo({top:v,behavior:"instant"}), base+off);
await p.waitForTimeout(700);
// the band from the top of the strip to the bottom of the view bar
const band = await p.evaluate(()=>{
  const s=document.getElementById("stripwrap").getBoundingClientRect();
  const v=document.querySelector(".vposwrap").getBoundingClientRect();
  return { x:0, y:Math.round(s.top), width:390, height:Math.round(v.bottom-s.top),
           gap: Math.round(v.top - s.bottom) };
});
console.log(`--- scroll +${off}  band ${JSON.stringify(band)}`);
const withContent = await p.screenshot({ clip: band });
writeFileSync(`${OUT}/bleed-before.png`, withContent);
await p.evaluate(()=>{ document.getElementById("opts").style.visibility="hidden";
  const t=document.querySelector(".total"); if(t) t.style.visibility="hidden";
  const c=document.getElementById("carat"); if(c) c.style.visibility="hidden"; });
await p.waitForTimeout(500);
const without = await p.screenshot({ clip: band });
writeFileSync(`${OUT}/bleed-after.png`, without);
/* PNG bytes are useless for this — one changed pixel reshuffles the whole
   compressed stream. Decode and compare pixels, and say WHERE they differ. */
const px = async buf => p.evaluate(b64 => new Promise(res => {
  const im = new Image();
  im.onload = () => { const c = document.createElement("canvas");
    c.width = im.naturalWidth; c.height = im.naturalHeight;
    const g = c.getContext("2d"); g.drawImage(im, 0, 0);
    res({ w: c.width, h: c.height, d: Array.from(g.getImageData(0,0,c.width,c.height).data) }); };
  im.src = "data:image/png;base64," + b64;
}), buf.toString("base64"));
const A = await px(withContent), B = await px(without);
let diff = 0; const rows = new Array(A.h).fill(0);
for (let y = 0; y < A.h; y++) for (let x = 0; x < A.w; x++) {
  const i = (y * A.w + x) * 4;
  if (Math.abs(A.d[i]-B.d[i]) > 8 || Math.abs(A.d[i+1]-B.d[i+1]) > 8 || Math.abs(A.d[i+2]-B.d[i+2]) > 8) { diff++; rows[y]++; }
}
const bad = rows.map((n,y)=>[y,n]).filter(r=>r[1] > A.w*0.01);
console.log(`pixels showing through: ${diff} of ${A.w*A.h} (${(diff/(A.w*A.h)*100).toFixed(2)}%)`);
if (bad.length) {
  const runs = []; let cur = null;
  for (const [y,n] of bad) { if (cur && y === cur.to+1) { cur.to = y; cur.max = Math.max(cur.max,n); } else { if (cur) runs.push(cur); cur = {from:y,to:y,max:n}; } }
  if (cur) runs.push(cur);
  runs.forEach(r => console.log(`  leaking rows ${r.from}..${r.to} of ${A.h}  (up to ${r.max} px wide)`));
} else console.log("  nothing leaks through the sticky builder");
}
await b.close();
