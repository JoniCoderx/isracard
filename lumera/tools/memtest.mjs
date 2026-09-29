/* A chapter of full-screen frames must let go of them once the reader has left
   it, in either direction, and pick them up again on return. */
import { chromium } from "playwright-core";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0, 120)));
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2400); await p.click("#enterBtn", { timeout: 6000 }).catch(() => {});
await p.waitForTimeout(600);
const at = async (y, ms = 1800) => {
  const from = await p.evaluate(() => scrollY);
  for (let v = from; Math.abs(v - y) > 60; v += Math.sign(y - from) * 300) {
    await p.evaluate(t => scrollTo({ top: t, behavior: "instant" }), v); await p.waitForTimeout(45);
  }
  await p.evaluate(t => scrollTo({ top: t, behavior: "instant" }), y); await p.waitForTimeout(ms);
  return p.evaluate(() => ({ box: { on: __box.ok, n: __box.loaded }, film: { on: __film.ok, n: __film.loaded },
    boxTop: Math.round(document.getElementById("stonepin").getBoundingClientRect().top) }));
};
const seq = await p.evaluate(() => { const s = document.getElementById("stonepin").getBoundingClientRect(); return Math.round(s.top + scrollY + s.height / 2); });
const inBox = await at(seq);
ok(inBox.box.on && inBox.box.n > 0, `the box loads its frames while it is on screen (${inBox.box.n} held)`);
const total = await p.evaluate(() => document.documentElement.scrollHeight);
const past = await at(Math.min(total - 900, seq + 844 * 5));
ok(!past.box.on && past.box.n === 0, `the box lets them go once the reader is well past it (${past.box.n} held, pin at ${past.boxTop})`);
const back = await at(seq);
ok(back.box.on && back.box.n > 0, `and picks them up again on the way back (${back.box.n} held)`);
/* the box sits near the top of the page, so there is no position far enough
   above it to leave it upward from; the film is low enough to test that side */
const filmMid = await p.evaluate(() => { const s = document.getElementById("filmpin").getBoundingClientRect(); return Math.round(s.top + scrollY + s.height / 2); });
const inFilm = await at(filmMid);
ok(inFilm.film.on && inFilm.film.n > 0, `the film loads its frames while it is on screen (${inFilm.film.n} held)`);
const wayAbove = await at(Math.max(0, filmMid - 844 * 5));
ok(!wayAbove.film.on && wayAbove.film.n === 0, `and lets them go when the reader is well above it (${wayAbove.film.n} held)`);
ok(errs.length === 0, `no script errors (${errs[0] || ""})`);
console.log(`\n${pass} pass, ${fail} fail`);
await b.close();
process.exit(fail ? 1 : 0);
