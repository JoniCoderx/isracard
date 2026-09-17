import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{ width:390, height:844 }, deviceScaleFactor:2, isMobile:true, hasTouch:true });
await p.emulateMedia({ reducedMotion:"reduce" });
await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" });
await p.waitForTimeout(2600); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
await p.evaluate(() => document.querySelectorAll(".rv").forEach(e => e.classList.add("in")));
await p.waitForTimeout(600);
console.log(await p.evaluate(() => {
  const out = [];
  const lnk = document.querySelector(".lnk");
  const cs = getComputedStyle(lnk, "::after");
  out.push("lnk ::after content = " + cs.content + "   height=" + cs.height + "  (the arrow, or the tap pad?)");
  const arrowGone = cs.content === '""' || cs.content === "none";
  out.push("ARROWS ON TOUCH: " + (arrowGone ? "MISSING — the tap-pad rule overwrote the glyph" : "present"));

  const vis = e => { const b = e.getBoundingClientRect(); const c = getComputedStyle(e);
    return b.width > 0 && b.height > 0 && c.visibility !== "hidden" && c.display !== "none" && +c.opacity > 0.05; };
  [...document.querySelectorAll(".btn")].filter(vis).forEach(t => {
    const r = t.getBoundingClientRect(), cx = r.left + r.width/2, cy = r.top + r.height/2;
    const hit = document.elementFromPoint(cx, cy);
    if (hit && hit !== t && !t.contains(hit)) {
      const c = getComputedStyle(hit);
      out.push("COVERED: «" + (t.textContent||"").trim().slice(0,24) + "» is under " +
        ((hit.className||hit.tagName)+"").split(" ").slice(0,2).join(".") +
        "  z=" + c.zIndex + " pe=" + c.pointerEvents);
    }
  });
  return out.join("\n");
}));
await b.close();
