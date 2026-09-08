import { chromium } from "playwright-core";
const dir = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.goto("file://" + dir + "/silavu.html?nogl=1", { waitUntil:"load" }); await p.waitForTimeout(1000); await p.click("#enterBtn"); await p.waitForTimeout(1500);
await p.evaluate(() => { const el = document.getElementById("ch-ring"); const r = el.getBoundingClientRect(); window.scrollTo(0, scrollY + r.top + r.height*0.55 - innerHeight*0.5); });
await p.waitForTimeout(2500);
console.log(await p.evaluate(() => { const n = document.querySelector("#ch-ring .name"); const cs = getComputedStyle(n); const r = n.getBoundingClientRect(); return { cls:n.className, clip:cs.clipPath, op:cs.opacity, tf:cs.transform, filt:cs.filter, h:r.height, w:r.width, top:r.top, text:n.textContent, color:cs.color, fs:cs.fontSize, vis:cs.visibility, disp:cs.display }; }));
await b.close();
