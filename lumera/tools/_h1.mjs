import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
for (const port of [8780, 8777]) for (const path of ["", "he/"]) {
  const p = await (await b.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
  await p.goto(`http://localhost:${port}/${path}`, { waitUntil: "load" }); await p.waitForTimeout(1000); await p.evaluate(() => document.getElementById("enterBtn").click()); await p.waitForTimeout(2500);
  console.log(port, path || "en", await p.evaluate(() => { const h = document.querySelector("#hero h1"), r = h.getBoundingClientRect(); const hero = document.getElementById("hero").getBoundingClientRect(); const hc = document.querySelector("#hero .hc, #hero .wrap, #hero .hcopy");
    return JSON.stringify({ h1top: Math.round(r.top), h1h: Math.round(r.height), heroH: Math.round(hero.height), hh: getComputedStyle(document.documentElement).getPropertyValue("--hh"), lines: Math.round(r.height / parseFloat(getComputedStyle(h).lineHeight)) }); }));
}
await b.close();
