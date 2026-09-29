import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "networkidle" });
await p.waitForTimeout(1200);
const total = await p.evaluate(() => document.documentElement.scrollHeight);
console.log("y\thdrH\tbg\t\t\tcolor\t\tmixblend\tfilter");
for (let y = 0; y < total - 900; y += 760) {
  for (let v = Math.max(0,y-400); v <= y; v += 60) { await p.evaluate(t => scrollTo({top:t,behavior:"instant"}), v); await p.waitForTimeout(30); }
  await p.waitForTimeout(400);
  const r = await p.evaluate(() => { const h = document.getElementById("header"); const c = getComputedStyle(h); const m = h.querySelector(".mark"); const mc = getComputedStyle(m);
    return [Math.round(h.getBoundingClientRect().height), c.backgroundColor, mc.color, c.mixBlendMode + "/" + mc.mixBlendMode, c.filter + "/" + mc.filter, h.className]; });
  console.log(y + "\t" + r.join("\t"));
}
await b.close();
