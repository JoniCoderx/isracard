import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600); await p.click("#enterBtn").catch(()=>{});
await p.waitForTimeout(900);
const r = await p.evaluate(() => {
  const html = document.documentElement.outerHTML;
  const grab = (a, bb) => { const i = html.indexOf(a), j = html.indexOf(bb, i); return i < 0 || j < 0 ? 0 : j - i; };
  /* the bracelet's fragment shader and the modelled hand's own source */
  const fs = html.match(/var FS\s*=\s*[`"'][\s\S]*?[`"'];/);
  const hm = html.indexOf("function handMesh"), hmEnd = html.indexOf("function buildHand");
  return {
    page: html.length,
    fragmentShader: fs ? fs[0].length : 0,
    handModel: hm > 0 && hmEnd > hm ? hmEnd - hm : 0,
    skinBranchHits: (html.match(/uMode < -0\.5|isSkin|nail/g) || []).length
  };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
