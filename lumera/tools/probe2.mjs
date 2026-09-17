import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{ width:1440, height:900 } });
await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" });
await p.waitForTimeout(2600); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
await p.waitForTimeout(800);
console.log(await p.evaluate(() => {
  const out = [];
  let e = document.getElementById("filmcv");
  while (e && e !== document.documentElement) {
    const r = e.getBoundingClientRect(), c = getComputedStyle(e);
    out.push(`${e.tagName}.${(e.className||"").toString().split(" ")[0]||e.id} w=${r.width.toFixed(1)} l=${r.left.toFixed(1)} pad=${c.paddingLeft}/${c.paddingRight} bw=${c.borderLeftWidth} box=${c.boxSizing} pos=${c.position}`);
    e = e.parentElement;
  }
  out.push("innerWidth=" + innerWidth + " docClientWidth=" + document.documentElement.clientWidth);
  return out.join("\n");
}));
await b.close();
