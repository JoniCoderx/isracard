import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const out = [];
/* header crowding on the narrowest phones */
for (const w of [320, 360, 375, 390, 430]) {
  const p = await b.newPage({ viewport:{ width:w, height:800 } });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" });
  await p.waitForTimeout(2800); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
  await p.waitForTimeout(900);
  const r = await p.evaluate(() => {
    const box = s => { const e = document.querySelector(s); if (!e || !e.getClientRects().length) return null; const b = e.getBoundingClientRect(); return { l:Math.round(b.left), r:Math.round(b.right), w:Math.round(b.width) }; };
    const hit = (a, b) => a && b && a.r > b.l + 1 && b.r > a.l + 1;
    const mark = box("header .mark"), lang = box("#langBtn"), menu = box("#menuBtn"), bk = box(".hbook");
    return { mark, lang, menu, bk, overlapLang: hit(mark, lang), overlapMenu: hit(menu, mark), overlapBook: hit(bk, mark) };
  });
  out.push(`${w}: mark=${JSON.stringify(r.mark)} menu=${JSON.stringify(r.menu)} lang=${JSON.stringify(r.lang)} | over menu=${r.overlapMenu} lang=${r.overlapLang} book=${r.overlapBook}`);
  await p.close();
}
/* the typography interaction: does a heading actually answer the hand? */
{
  const p = await b.newPage({ viewport:{ width:1440, height:900 } });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" });
  await p.waitForTimeout(2800); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
  await p.waitForTimeout(1200);
  await p.evaluate(() => { const e = document.getElementById("house"); window.scrollTo({ top: scrollY + e.getBoundingClientRect().top, behavior:"instant" }); });
  await p.waitForTimeout(900);
  const box = await p.evaluate(() => { const h = document.querySelector("#house .h2"); const b = h.getBoundingClientRect(); return { x: b.left + b.width * 0.3, y: b.top + b.height / 2 }; });
  await p.mouse.move(box.x, box.y); await p.waitForTimeout(500);
  const st = await p.evaluate(() => { const h = document.querySelector("#house .h2");
    const w = h.querySelector(".w");
    return { lit: h.classList.contains("lit"), hdx: h.style.getPropertyValue("--hdx"), hx: h.style.getPropertyValue("--hx"),
             wx: w ? w.style.getPropertyValue("--wx") : null, tf: getComputedStyle(h).transform, glow: getComputedStyle(h, "::after").opacity }; });
  out.push(`type interaction: ${JSON.stringify(st)}`);
  await p.mouse.move(5, 5); await p.waitForTimeout(500);
  out.push(`after leaving: lit=${await p.evaluate(() => document.querySelector("#house .h2").classList.contains("lit"))}`);
  /* the compass over the content */
  const clash = await p.evaluate(() => {
    const f = document.getElementById("where"); const r = f.getBoundingClientRect();
    const els = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2).filter(e => e !== f && !f.contains(e));
    return els.slice(0, 3).map(e => e.tagName + "." + (e.className || "").toString().split(" ")[0]);
  });
  out.push(`compass sits over: ${clash.join(", ")}`);
  await p.close();
}
console.log(out.join("\n"));
await b.close();
