import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
const p = await b.newPage({ viewport:{width:1440,height:900} }); await p.emulateMedia({ reducedMotion: "reduce" });
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" }); await p.waitForTimeout(1200); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(500);
await p.evaluate(() => window.scrollTo(0, scrollY + document.getElementById("clients").getBoundingClientRect().top + 300)); await p.waitForTimeout(900);
console.log(JSON.stringify(await p.evaluate(() => { const e = document.elementFromPoint(900, 450); const cp = document.querySelector("#clients .copy .p"); const r = cp.getBoundingClientRect(); return { at: e && (e.tagName + "." + e.className), cpTop: Math.round(r.top), cpOpacity: getComputedStyle(cp).opacity, cpColor: getComputedStyle(cp).color, scrollY, btn: getComputedStyle(document.querySelector(".hacts .btn.solid")).color }; })));
await p.screenshot({ path: "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/v9/shots/d-clients.png" });
await b.close();
