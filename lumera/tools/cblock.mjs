/* Does anything between #stripwrap and the document make a containing block?
   position:fixed inside a transformed, filtered or contained ancestor is not
   fixed to the viewport at all, and that is the whole trick of a full screen. */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2200); await p.click("#enterBtn").catch(()=>{});
await p.waitForTimeout(700);
console.log(await p.evaluate(() => {
  const out = [];
  let e = document.getElementById("stripwrap");
  while (e && e !== document.documentElement) {
    const cs = getComputedStyle(e);
    const why = [];
    if (cs.transform !== "none") why.push("transform");
    if (cs.filter !== "none") why.push("filter");
    if (cs.backdropFilter && cs.backdropFilter !== "none") why.push("backdrop-filter");
    if (cs.perspective !== "none") why.push("perspective");
    if (cs.contain && /paint|layout|strict|content/.test(cs.contain)) why.push("contain:" + cs.contain);
    if (cs.willChange && /transform|filter|perspective/.test(cs.willChange)) why.push("will-change:" + cs.willChange);
    if (cs.containerType && cs.containerType !== "normal") why.push("container-type");
    out.push((e.id ? "#" + e.id : e.tagName.toLowerCase() + "." + String(e.className).split(" ")[0]) + (why.length ? "  <-- " + why.join(", ") : ""));
    e = e.parentElement;
  }
  return out.join("\n");
}));
await b.close();
