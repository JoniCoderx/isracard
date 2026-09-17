import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{ width:390, height:844 }, deviceScaleFactor:2, isMobile:true, hasTouch:true });
await p.emulateMedia({ reducedMotion:"reduce" });
await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" });
await p.waitForTimeout(2600); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
await p.evaluate(() => document.querySelectorAll(".rv").forEach(e => e.classList.add("in")));
await p.waitForTimeout(500);
console.log(await p.evaluate(() => {
  const c = document.querySelector(".cert"), s = getComputedStyle(c);
  const par = c.parentElement, ps = getComputedStyle(par);
  const gp = par.parentElement, gs = getComputedStyle(gp);
  return [
    "cert   h=" + c.getBoundingClientRect().height.toFixed(1) + " pad=" + s.padding + " display=" + s.display + " minH=" + s.minHeight + " overflow=" + s.overflow,
    "  children: " + [...c.children].map(x => x.tagName + " h=" + x.getBoundingClientRect().height.toFixed(1) + " fs=" + getComputedStyle(x).fontSize).join("  "),
    "parent ." + (par.className||"") + " h=" + par.getBoundingClientRect().height.toFixed(1) + " display=" + ps.display + " overflow=" + ps.overflow + " clip=" + ps.clipPath,
    "grand  ." + (gp.className||"") + " h=" + gp.getBoundingClientRect().height.toFixed(1) + " overflow=" + gs.overflow + " clip=" + gs.clipPath + " transform=" + gs.transform,
  ].join("\n");
}));
await b.close();
