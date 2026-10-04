// One reader, many languages in a row, mid-page: every change stays in place,
// keeps the page's state, and leaves the right address.
import { chromium } from "playwright-core";
const base = process.env.BASE || "http://localhost:8777/";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
for (const [w, mob] of [[1366, false], [390, true]]) {
  const c = await b.newContext({ viewport: { width: w, height: 800 }, hasTouch: mob, isMobile: mob });
  const p = await c.newPage(); p.on("pageerror", e => ok(false, `${w} page error: ${e.message}`));
  await p.goto(base, { waitUntil: "load" }); await p.waitForTimeout(900);
  await p.evaluate(() => { window.__mark = 1; document.documentElement.style.scrollBehavior = "auto"; const e = document.querySelector("#collection .pgrid"); scrollTo(0, e.getBoundingClientRect().top + scrollY - 100); });
  await p.waitForTimeout(1500);
  for (const to of ["fr", "ar", "ru", "he", "fr", "en"]) {
    const id = await p.evaluate(() => ["langBtn", "langBtn2", "langBtn3"].find(i => { const e = document.getElementById(i); if (!e) return false; const r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 0 && c.visibility === "visible" && +c.opacity > 0.5 && r.top >= 0 && r.top < innerHeight; }));
    const btn = p.locator("#" + id); if (mob) await btn.tap(); else await btn.click();
    await p.waitForFunction(() => document.getElementById("langmenu").classList.contains("open"), null, { timeout: 3000 }).catch(() => {}); await p.waitForTimeout(400);
    const before = await p.evaluate(() => { const at = window.__langAnchor(); window.__eye = at.el; return Math.round(at.el.getBoundingClientRect().top); });
    const it = p.locator(`#langmenu [data-lang="${to}"]`); if (mob) await it.tap(); else await it.click();
    await p.waitForFunction(t => document.documentElement.lang === t && !document.documentElement.classList.contains("langing"), to, { timeout: 10000 }).catch(() => {});
    await p.waitForTimeout(1000);
    const a = await p.evaluate(() => ({ mark: window.__mark, lang: document.documentElement.lang, dir: document.documentElement.dir, top: Math.round(window.__eye.getBoundingClientRect().top), url: location.pathname + location.search, sample: document.querySelector("#collection .sechead h2").textContent.trim().slice(0, 30) }));
    const urlOk = to === "he" ? /\/he\/$/.test(a.url) : to === "en" ? !/\/he\/|lang=/.test(a.url) : new RegExp("lang=" + to).test(a.url) && !/\/he\//.test(a.url);
    ok(a.mark === 1 && a.lang === to && Math.abs(a.top - before) <= 4 && urlOk && a.dir === (to === "he" || to === "ar" ? "rtl" : "ltr"),
      `${w} → ${to}: in place, ${a.dir}, ${a.url}, held ${before}→${a.top}px, "${a.sample}"`);
  }
  /* the address it was left on opens in that language */
  await p.reload({ waitUntil: "load" }); await p.waitForTimeout(800);
  ok(await p.evaluate(() => document.documentElement.lang) === "en", `${w} the address it ends on opens in English`);
  await c.close();
}
console.log(`${pass} pass, ${fail} fail`); await b.close(); process.exit(fail ? 1 : 0);
