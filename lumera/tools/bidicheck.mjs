import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{ width:1440, height:900 }, deviceScaleFactor:2 });
await p.emulateMedia({ reducedMotion:"reduce" });
await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" });
await p.waitForTimeout(2600); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
await p.evaluate(() => document.getElementById("langBtn").click());
await p.waitForTimeout(1100);
console.log(await p.evaluate(() => {
  const s = [...document.querySelectorAll(".hfacts .row span")];
  return s.map(e => {
    const c = getComputedStyle(e);
    return "«" + e.textContent.trim() + "»  dir=" + c.direction + " bidi=" + c.unicodeBidi;
  }).join("\n");
}));
await b.close();
