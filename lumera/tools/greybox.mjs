/* The hero sits over a photograph and .hcap carries an inline opacity, which
   makes it an isolated group. Anything blended inside it paints its own box.
   Stand a bright panel behind the hero and look. */
import { chromium } from "playwright-core";
import fs from "fs";
const DIR = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/v19";
fs.mkdirSync(DIR, { recursive:true });
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [tag, w, h] of [["d",1440,900],["m390",390,844]]) {
  const p = await b.newPage({ viewport:{ width:w, height:h } });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" });
  await p.waitForTimeout(2800); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
  await p.waitForTimeout(1200);
  /* a stand-in for the photograph that is not served from file:// */
  await p.evaluate(() => {
    const s = document.createElement("style");
    s.textContent = "#hero .hm, #hero { background:linear-gradient(160deg,#cfd3d6,#9aa1a6 40%,#e6e8ea 70%,#7f868b) !important; }";
    document.head.appendChild(s);
  });
  await p.waitForTimeout(300);
  const box = await p.evaluate(() => { const e = document.querySelector("#hero .h"); const r = e.getBoundingClientRect(); return { x: r.left + r.width * 0.35, y: r.top + r.height / 2 }; });
  await p.mouse.move(box.x, box.y); await p.waitForTimeout(700);
  await p.screenshot({ path: `${DIR}/${tag}-hero-lit.png` });
  const st = await p.evaluate(() => {
    const blended = [...document.querySelectorAll("#silavu *")].filter(e => {
      const c = getComputedStyle(e); return c.mixBlendMode !== "normal" && c.mixBlendMode !== "";
    }).map(e => e.className + ":" + getComputedStyle(e).mixBlendMode);
    const pseudo = ["::after","::before"].map(q => { const c = getComputedStyle(document.querySelector("#hero .h"), q); return q + " content=" + c.content + " blend=" + c.mixBlendMode; });
    const h = document.querySelector("#hero .h");
    return { blended: blended.slice(0,8), pseudo, lit: h.classList.contains("lit"), wl: h.querySelector(".w") ? h.querySelector(".w").style.getPropertyValue("--wl") : h.style.getPropertyValue("--wl"), filt: getComputedStyle(h.querySelector(".w") || h).filter };
  });
  console.log(tag, JSON.stringify(st));
  await p.close();
}
await b.close();
