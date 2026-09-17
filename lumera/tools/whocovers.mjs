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
  const t = [...document.querySelectorAll(".btn")].find(e => /Book a private/.test(e.textContent) && e.getBoundingClientRect().width > 0);
  const r = t.getBoundingClientRect();
  out.push("target: «" + t.textContent.trim() + "» in #" + (t.closest("section,div[id]")||{id:"?"}).id + "  at " + Math.round(r.left) + "," + Math.round(r.top));
  const stack = document.elementsFromPoint(r.left + r.width/2, r.top + r.height/2);
  stack.slice(0, 6).forEach(e => {
    const c = getComputedStyle(e);
    const owner = e.closest("#menu") ? "INSIDE #menu" : e.closest("header") ? "in header" : e.closest("main") ? "in main" : "elsewhere";
    out.push("   " + ((e.className||e.tagName)+"").split(" ").slice(0,2).join(".").padEnd(22) + owner.padEnd(14) + " pe=" + c.pointerEvents + " vis=" + c.visibility + " op=" + c.opacity);
  });
  const menu = document.getElementById("menu");
  const mc = getComputedStyle(menu);
  out.push("\n#menu when closed: display=" + mc.display + " visibility=" + mc.visibility + " opacity=" + mc.opacity + " pointer-events=" + mc.pointerEvents);
  const mb = menu.querySelector(".btn.solid");
  out.push("its .btn.solid: pe=" + getComputedStyle(mb).pointerEvents + "  pad pe=" + getComputedStyle(mb, "::after").pointerEvents + "  rect=" + JSON.stringify(mb.getBoundingClientRect().toJSON()).slice(0,70));
  return out.join("\n");
}));
await b.close();
