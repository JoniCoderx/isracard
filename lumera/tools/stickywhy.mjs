import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2200); await p.click("#enterBtn").catch(()=>{});
await p.waitForTimeout(800);
console.log(await p.evaluate(() => {
  const out = []; let e = document.getElementById("stripwrap");
  const cs0 = getComputedStyle(e);
  out.push("#stripwrap position=" + cs0.position + " top=" + cs0.top + " h=" + Math.round(e.getBoundingClientRect().height));
  let n = e.parentElement;
  while (n && n !== document.documentElement) {
    const cs = getComputedStyle(n);
    const flags = [];
    if (cs.overflow !== "visible") flags.push("overflow:" + cs.overflow);
    if (cs.overflowX !== "visible") flags.push("overflow-x:" + cs.overflowX);
    if (cs.overflowY !== "visible") flags.push("overflow-y:" + cs.overflowY);
    if (cs.display.indexOf("flex") >= 0 || cs.display.indexOf("grid") >= 0) flags.push("display:" + cs.display + " align:" + cs.alignItems);
    if (cs.contain && cs.contain !== "none") flags.push("contain:" + cs.contain);
    out.push((n.id ? "#" + n.id : n.tagName.toLowerCase() + "." + String(n.className).split(" ")[0]) + "  h=" + Math.round(n.getBoundingClientRect().height) + (flags.length ? "  " + flags.join(", ") : ""));
    n = n.parentElement;
  }
  return out.join("\n");
}));
await b.close();
