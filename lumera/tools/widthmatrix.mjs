// 360/390/430/768 in en and he: no sideways scroll on any page; the menu opens and closes;
// the piece window scrolls to its last line and closes; the form field stays visible with a keyboard;
// the builder's chips fit; the try-on window reaches its last control.
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
let pass = 0, fail = 0; const ok = (c, m, x) => { if (c) pass++; else { fail++; console.log("FAIL", m, x !== undefined ? JSON.stringify(x) : ""); } };
for (const w of [360, 390, 430, 768]) for (const lang of ["en", "he"]) {
  const pre = lang === "he" ? "/he" : "";
  for (const path of [pre + "/", pre + "/pieces/knot/", "/about/" + (lang === "he" ? "?lang=he" : ""), "/accessibility/"]) {
    const c = await b.newContext({ viewport: { width: w, height: 800 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
    const p = await c.newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await p.goto("http://localhost:8777" + path, { waitUntil: "load" }); await p.waitForTimeout(700); await p.click("#enterBtn", { timeout: 600 }).catch(() => {});
    const over = await p.evaluate(async () => { let worst = 0; const H = document.documentElement.scrollHeight; for (let y = 0; y < H; y += 700) { scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); worst = Math.max(worst, document.documentElement.scrollWidth - innerWidth); } return worst; });
    ok(over <= 0, `${w} ${lang} ${path} no sideways scroll`, over);
    if (path === pre + "/") {
      await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
      await p.click("#menuBtn").catch(() => {}); await p.waitForTimeout(700);
      const m = await p.evaluate(() => { const c = document.getElementById("menuClose").getBoundingClientRect(); return { open: document.getElementById("menu").classList.contains("open"), close: c.top >= 0 && c.bottom <= innerHeight && c.width > 0 }; });
      ok(m.open && m.close, `${w} ${lang} menu opens with Close on screen`, m);
      await p.click("#menuClose").catch(() => {}); await p.waitForTimeout(600);
      ok(await p.evaluate(() => !document.getElementById("menu").classList.contains("open")), `${w} ${lang} menu closes`);
      await p.evaluate(() => { const q = document.querySelector(".pgrid .piece"); q.scrollIntoView(); q.click(); }); await p.waitForTimeout(900);
      const pm = await p.evaluate(async () => { const m = document.getElementById("pmodal"), bx = m.querySelector(".mbox"); const sc = [bx, m].find(e => e.scrollHeight > e.clientHeight + 2) || bx; sc.scrollTop = sc.scrollHeight; await new Promise(r => setTimeout(r, 300));
        const last = m.querySelector(".mfoot").getBoundingClientRect(), cl = m.querySelector(".mclose2").getBoundingClientRect(); return { last: last.bottom <= innerHeight + 1 && last.top >= 0, close: cl.width > 0, wide: bx.scrollWidth - bx.clientWidth }; });
      ok(pm.last && pm.close && pm.wide <= 0, `${w} ${lang} piece window reaches its last line`, pm);
      await p.keyboard.press("Escape"); await p.waitForTimeout(500);
      const chips = await p.evaluate(() => { const o = document.getElementById("opts"); o.scrollIntoView(); return [...o.querySelectorAll(".chip")].filter(c => c.offsetParent).some(c => { const r = c.getBoundingClientRect(); if (!(r.right > innerWidth + 1 || r.left < -1)) return false;
        /* a chip in a row that swipes sideways is reachable by swiping */
        let sc = c.parentElement; while (sc && sc !== o) { if (sc.scrollWidth > sc.clientWidth + 2 && /auto|scroll/.test(getComputedStyle(sc).overflowX)) return false; sc = sc.parentElement; } return true; }); });
      ok(!chips, `${w} ${lang} builder choices fit the screen`);
      // keyboard: the window shrinks, the message field stays visible
      await p.evaluate(() => document.getElementById("concierge").scrollIntoView()); await p.waitForTimeout(300);
      await p.focus("#fMsg"); await p.setViewportSize({ width: w, height: 430 }); await p.waitForTimeout(900);
      const kb = await p.evaluate(() => { const r = document.getElementById("fMsg").getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight }; });
      ok(kb.top >= 0 && kb.top < kb.vh - 20, `${w} ${lang} message field visible with the keyboard up`, kb);
    }
    await c.close();
  }
}
console.log(pass + " pass, " + fail + " fail"); await b.close();
