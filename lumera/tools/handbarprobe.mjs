import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const w of [390, 320]) {
  const p = await b.newPage({ viewport: { width: w, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2400); await p.click("#enterBtn").catch(()=>{});
  await p.waitForTimeout(700);
  await p.evaluate(async () => { const s = Math.round(innerHeight*0.8); for (let y=0;y<document.body.scrollHeight;y+=s){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,70));} });
  await p.evaluate(() => document.getElementById("stripwrap").scrollIntoView({ block:"start", behavior:"instant" }));
  await p.waitForTimeout(500);
  const t = await p.$$(".vt .vtb"); if (t[1]) await t[1].click();
  await p.waitForTimeout(2200);
  console.log(w, await p.evaluate(() => {
    const bar = document.getElementById("handbar"), r = bar.getBoundingClientRect(); const tb = document.querySelector(".stbtn"), tr = tb ? tb.getBoundingClientRect() : null; const sw = document.getElementById("stripwrap").getBoundingClientRect();
    const sk = [...bar.querySelectorAll(".sk")].map(e => { const q = e.getBoundingClientRect(); return Math.round(q.width)+"x"+Math.round(q.height); });
    const btn = [...bar.querySelectorAll("button:not(.sk)")].map(e => { const q = e.getBoundingClientRect(); return e.textContent.trim()+" "+Math.round(q.width)+"x"+Math.round(q.height); });
    const row = bar.querySelector(".hgrp.skins").getBoundingClientRect();
    return JSON.stringify({ turnIt: tr ? Math.round(tr.left)+","+Math.round(tr.top)+" "+Math.round(tr.width)+"x"+Math.round(tr.height)+" disp="+getComputedStyle(tb).display : "none", strip: Math.round(sw.top)+".."+Math.round(sw.bottom), bar: Math.round(r.width)+"x"+Math.round(r.height)+" top="+Math.round(r.top),
      overflows: row.width > r.width + 1, skinRow: Math.round(row.width), sk, btn });
  }));
  await p.close();
}
await b.close();
