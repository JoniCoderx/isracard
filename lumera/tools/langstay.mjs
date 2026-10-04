// Changing language keeps the reader where they are: no reload, no jump to the
// top, the same section and the same words-in-view, translated in place.
import { chromium } from "playwright-core";
const base = process.env.BASE || "http://localhost:8777/";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
for (const [w, mob] of [[1366, false], [390, true]]) for (const start of ["", "he/"]) for (const sec of ["#collection", "#build", "#concierge"]) {
  const c = await b.newContext({ viewport: { width: w, height: 800 }, hasTouch: mob, isMobile: mob });
  const p = await c.newPage(); let navs = 0; p.on("pageerror", e => console.log("PAGEERROR", w, start, sec, e.message)); p.on("console", m => { if (m.type() === "error") console.log("CONSOLE", w, start, sec, m.text().slice(0, 200)); });
  await p.goto(base + start, { waitUntil: "load" }); await p.waitForTimeout(900);
  p.on("framenavigated", f => { if (f === p.mainFrame()) navs++; });
  await p.evaluate(() => { window.__mark = 1; document.documentElement.style.scrollBehavior = "auto"; });
  await p.evaluate(s => { const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY + 120); }, sec);
  await p.waitForTimeout(1500);
  /* the thing under the reader's eye: the element a third of the way down */
  const to = start ? "en" : "he";
  const id = await p.evaluate(() => ["langBtn", "langBtn2", "langBtn3"].find(i => { const e = document.getElementById(i); if (!e) return false; const r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 0 && c.visibility === "visible" && +c.opacity > 0.5 && r.top >= 0 && r.top < innerHeight; }));
  if (!id) { ok(false, `${w} no language button in view`); await c.close(); continue; }
  const btn = p.locator("#" + id);
  if (mob) await btn.tap(); else await btn.click();
  await p.waitForFunction(() => document.getElementById("langmenu").classList.contains("open"), null, { timeout: 3000 }).catch(() => {});
  await p.waitForTimeout(500);
  const before = await p.evaluate(() => { const at = window.__langAnchor && window.__langAnchor(); const e = at ? at.el : document.body;
    window.__eye = e; return { y: scrollY, top: Math.round(e.getBoundingClientRect().top), what: e.tagName + "." + e.className.toString().slice(0, 20) }; });
  const it = p.locator(`#langmenu [data-lang="${to}"]`); if (mob) await it.tap(); else await it.click();
  await p.waitForFunction(() => !document.documentElement.classList.contains("langing"), null, { timeout: 10000 }).catch(() => {});
  await p.waitForTimeout(1200);
  const after = await p.evaluate(s => ({ mark: window.__mark, y: scrollY, top: Math.round(window.__eye.getBoundingClientRect().top), lang: document.documentElement.lang, dir: document.documentElement.dir, url: location.pathname + location.search }), sec).catch(() => ({}));
  const tag = `${w} ${start || "en/"}→${to} at ${sec}`;
  ok(after.mark === 1, `${tag}: no reload (the page's own state survives)`);
  ok(after.lang === to, `${tag}: page now ${after.lang} ${after.dir}`);
  ok(Math.abs((after.top ?? 9999) - before.top) <= 4, `${tag}: what was in view stays in view (${before.what} at ${before.top} → ${after.top}px; scroll ${Math.round(before.y)} → ${Math.round(after.y)})`);
  ok(to === "he" ? /\/he\/$/.test(after.url) : !/\/he\//.test(after.url), `${tag}: address follows the language (${after.url})`);
  await c.close();
}
console.log(`${pass} pass, ${fail} fail`); await b.close(); process.exit(fail ? 1 : 0);
