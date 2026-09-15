import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
for (const [tag, vp] of [["m", { width:390, height:844, deviceScaleFactor:3, isMobile:true, hasTouch:true }], ["d", { width:1440, height:900 }]]) {
  const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor || 1, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch });
  const p = await ctx.newPage();
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" }); await p.waitForTimeout(3200); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(800);
  await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })); await p.waitForTimeout(3000);
  const a = await p.evaluate(() => { const f = document.querySelector(".fbig"); const r = f.getBoundingClientRect(); return { in: f.classList.contains("in"), top: Math.round(r.top), h: Math.round(r.height), vh: innerHeight, scrollY: Math.round(scrollY), sh: document.body.scrollHeight, cls: f.className }; });
  // nudge scroll by a pixel and wait, in case the observer needs a scroll event
  await p.evaluate(() => window.scrollBy(0, -2)); await p.waitForTimeout(1500);
  const c = await p.evaluate(() => ({ in: document.querySelector(".fbig").classList.contains("in"), fo: getComputedStyle(document.querySelector("#end svg.sy.huge path")).fillOpacity }));
  console.log(tag, JSON.stringify(a), "after nudge", JSON.stringify(c));
  await ctx.close();
}
await b.close();
