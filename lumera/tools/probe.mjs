import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
const p = await b.newPage({ viewport:{width:1440,height:900} }); await p.emulateMedia({ reducedMotion: "reduce" }); const errs=[]; p.on("pageerror", e => errs.push(e.message));
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" }); await p.waitForTimeout(1200); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(900);
await p.evaluate(() => { const h = document.getElementById("hpin"); window.scrollTo({top: scrollY + h.getBoundingClientRect().top + (h.offsetHeight - innerHeight) * 0.6, behavior:"instant"}); }); await p.waitForTimeout(500);
console.log(JSON.stringify(await p.evaluate(() => { const t = document.getElementById("htrack"), h = document.getElementById("hpin"); return { tf: getComputedStyle(t).transform, hpinH: h.offsetHeight, sw: t.scrollWidth, vw: innerWidth, pieces: document.querySelectorAll(".htrack .piece").length, styleH: h.style.height }; })), errs);
await b.close();
