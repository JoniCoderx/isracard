import { chromium } from "playwright-core"; import fs from "fs";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/col/"; fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
const tag = process.argv[2] || "a";
for (const [w,h] of [[1440,900],[1024,768],[390,844]]) {
  const p = await b.newPage({ viewport:{width:w,height:h} });
  await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" }); await p.waitForTimeout(1500); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(500);
  for (const c of ["all","bracelets","rings","necklaces","earrings"]) {
    await p.evaluate(c => document.querySelector(`.cat[data-cat="${c}"]`).click(), c); await p.waitForTimeout(700);
    await p.evaluate(() => { const e=document.querySelector("#collection .cats"); scrollTo(0, scrollY+e.getBoundingClientRect().top-80); }); await p.waitForTimeout(900);
    const info = await p.evaluate(() => { const g=document.querySelector(".pgrid"); return { cols: getComputedStyle(g).gridTemplateColumns.split(" ").length, vis:[...g.children].filter(x=>!x.hidden && x.offsetParent).map(x=>(x.classList.contains("soon")?"soon:":"")+Math.round(x.getBoundingClientRect().width)+"x"+Math.round(x.getBoundingClientRect().height)), gridH: Math.round(g.getBoundingClientRect().height) }; });
    console.log(w, c, JSON.stringify(info));
    const g = await p.$("#collection"); await p.screenshot({ path: `${OUT}${tag}-${w}-${c}.png`, clip: await p.evaluate(() => { const r=document.querySelector("#collection").getBoundingClientRect(); return { x:0, y:Math.max(0,r.top+scrollY) - scrollY < 0 ? 0 : r.top, width: innerWidth, height: Math.min(innerHeight*1.6, r.height) }; }), fullPage:false }).catch(async()=>{ await p.screenshot({ path: `${OUT}${tag}-${w}-${c}.png` }); });
  }
  await p.close();
}
await b.close();
