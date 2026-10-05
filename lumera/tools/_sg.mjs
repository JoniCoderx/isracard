import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const c = await b.newContext({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
const p = await c.newPage();
await p.goto("http://localhost:8777/", { waitUntil: "load" }); await p.waitForTimeout(800);
const r = await p.evaluate(() => { const q = s => document.querySelector(s); const cs = e => getComputedStyle(e);
  const st = q("#craft .sgstage"), cr = q("#craft"), fig = q("#craft .sgfig"), ins = q("#inside");
  return { craftBg: cs(cr).backgroundColor, stageBg: cs(st).backgroundColor, stageBgImg: cs(st).backgroundImage.slice(0, 80), stageH: st.getBoundingClientRect().height, craftH: cr.getBoundingClientRect().height,
    figTop: fig.getBoundingClientRect().top - st.getBoundingClientRect().top, figH: fig.getBoundingClientRect().height, insideBg: cs(ins).backgroundColor, insideBottom: ins.getBoundingClientRect().bottom + scrollY, craftTop: cr.getBoundingClientRect().top + scrollY,
    pinH: q("#stonepin").getBoundingClientRect().height, insH: ins.getBoundingClientRect().height }; });
console.log(JSON.stringify(r));
await b.close();
