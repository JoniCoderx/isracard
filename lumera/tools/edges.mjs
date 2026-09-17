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
    return b.width > 0 && b.height > 0 && c.visibility !== "hidden" && c.display !== "none" && +c.opacity > 0.05; };
  const out = [];
  ["build","clients","what","collection"].forEach(id => {
    const s = document.getElementById(id);
    const items = [...s.querySelectorAll(".k, .h, .h2, .p, .btn, .lnk, .t, .fact .t, .fact .d, .bsl")].filter(vis)
      .filter(e => getComputedStyle(e).textAlign !== "center")
      .filter(e => !e.closest(".tray, .htrack, .pieces, .cards, .bjourney"));   /* leave the side-scrollers out */
    const by = {};
    items.forEach(e => { const x = Math.round(e.getBoundingClientRect().left); (by[x] = by[x] || []).push((e.className||e.tagName).split(" ").slice(0,2).join(".") + "«" + (e.textContent||"").trim().slice(0,22) + "»"); });
    out.push("── #" + id);
    Object.keys(by).map(Number).sort((a,c)=>a-c).forEach(x => out.push("   x=" + x + "  " + by[x].slice(0,4).join("  ")));
  });
  return out.join("\n");
}));
await b.close();
