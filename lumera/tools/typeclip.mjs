/* Does any letter of any headline get cut?
   Layout metrics can't see it: a glyph's ink can hang outside its advance width
   (an italic serif always does), and the word masks have overflow:hidden. So we
   measure the real ink box of every word with canvas metrics and compare it
   against the box that is allowed to paint. */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const out = [];
for (const [tag, w, h, lang] of [["320",320,720,"en"],["375",375,812,"en"],["390",390,844,"en"],["430",430,932,"en"],["768",768,1024,"en"],["1440",1440,900,"en"],["390he",390,844,"he"],["1440he",1440,900,"he"]]) {
  const p = await b.newPage({ viewport:{ width:w, height:h } });
  await p.emulateMedia({ reducedMotion:"reduce" });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" });
  await p.waitForTimeout(2600); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
  if (lang === "he") { await p.evaluate(() => document.getElementById("langBtn").click()); await p.waitForTimeout(900); }
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700);
  /* reveal everything so nothing is measured while still hidden */
  await p.evaluate(() => { document.querySelectorAll(".rv").forEach(e => e.classList.add("in")); });
  await p.waitForTimeout(400);

  const clipped = await p.evaluate(() => {
    const cv = document.createElement("canvas"), cx = cv.getContext("2d");
    const bad = [];
    document.querySelectorAll(".h, .h2, .h3, .card .t, .piece .t, .bsl, .bline, .beat .h2").forEach(el => {
      if (!el.getClientRects().length) return;
      const spans = el.querySelectorAll(".w > span");
      const targets = spans.length ? spans : [el];
      targets.forEach(s => {
        const txt = s.textContent.trim(); if (!txt) return;
        const cs = getComputedStyle(s);
        cx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const m = cx.measureText(txt);
        if (m.actualBoundingBoxLeft === undefined) return;
        const box = s.parentElement && s.parentElement.classList.contains("w") ? s.parentElement : el;
        const bcs = getComputedStyle(box);
        if (bcs.overflow === "visible" && bcs.overflowX === "visible" && bcs.overflowY === "visible") return;
        const padL = parseFloat(bcs.paddingLeft), padR = parseFloat(bcs.paddingRight);
        const padT = parseFloat(bcs.paddingTop), padB = parseFloat(bcs.paddingBottom);
        /* ink that reaches past the padding box is ink the mask eats */
        const overL = m.actualBoundingBoxLeft - padL;
        const overR = (m.actualBoundingBoxRight - m.width) - padR;
        const overT = m.actualBoundingBoxAscent - (parseFloat(cs.fontSize) * 0.0 + padT + parseFloat(bcs.height) - padT - padB) * 0;
        const rect = box.getBoundingClientRect();
        const inkH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
        const overV = inkH - rect.height;
        const worst = Math.max(overL, overR, overV);
        if (worst > 0.6) bad.push({ t: txt, cls: el.className.split(" ")[0], l:+overL.toFixed(2), r:+overR.toFixed(2), v:+overV.toFixed(2) });
      });
    });
    return bad;
  });
  const overflow = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth,
    wide: [...document.querySelectorAll("#silavu *")].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1.5 || r.left < -1.5) && getComputedStyle(e).position !== "fixed" && !e.closest("[aria-hidden=true], .modal, #menu, .tray, .htrack, .pieces, .cards, .bjourney"); }).slice(0,6).map(e => e.className + "|" + Math.round(e.getBoundingClientRect().right)) }));
  out.push(`${tag}: clipped=${clipped.length} scrollWidth=${overflow.sw} inner=${overflow.iw} overflowing=${overflow.wide.length}`);
  clipped.slice(0, 8).forEach(c => out.push(`   CLIP ${tag} "${c.t}" .${c.cls} l=${c.l} r=${c.r} v=${c.v}`));
  overflow.wide.forEach(x => out.push(`   OVER ${tag} ${x}`));
  await p.close();
}
console.log(out.join("\n"));
await b.close();
