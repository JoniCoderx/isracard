/* Not "how big is the box" but "if a thumb lands here, what gets the tap". */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{ width:390, height:844 }, deviceScaleFactor:2, isMobile:true, hasTouch:true });
await p.emulateMedia({ reducedMotion:"reduce" });
await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" });
await p.waitForTimeout(2600); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
await p.evaluate(() => document.querySelectorAll(".rv").forEach(e => e.classList.add("in")));
await p.waitForTimeout(600);
console.log(await p.evaluate(() => {
  const vis = e => { const b = e.getBoundingClientRect(); const c = getComputedStyle(e);
    if (e.closest(".modal:not(.open), #menu:not(.open)")) return false;   /* closed overlays are not on screen */
    return b.width > 0 && b.height > 0 && c.visibility !== "hidden" && c.display !== "none" && +c.opacity > 0.05; };
  const targets = [...document.querySelectorAll("a[href], button, .chip, .lnk, .vp, .vtb, .cert, .clock")].filter(vis);
  const bad = [];
  targets.forEach(t => {
    const r = t.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    /* probe 22px above and below the centre: a 44px target should own both */
    let owned = 0, probes = 0;
    [-21, -11, 0, 11, 21].forEach(dy => {
      const y = r.top + r.height / 2 + dy;
      if (y < 2 || y > innerHeight - 2) return;
      probes++;
      const hit = document.elementFromPoint(cx, y);
      if (hit && (hit === t || t.contains(hit) || hit.parentElement === t)) owned++;
    });
    if (probes >= 3 && owned < probes) bad.push(((t.className||t.tagName)+"").split(" ")[0] + "«" + (t.textContent||"").trim().slice(0,20) + "» owns " + owned + "/" + probes + "  box " + Math.round(r.width) + "x" + Math.round(r.height));
  });
  return "targets probed: " + targets.length + "\nnot owning a 44px column: " + bad.length + "\n  " + bad.slice(0,16).join("\n  ");
}));
await b.close();
