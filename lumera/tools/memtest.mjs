/* A chapter of full-screen frames must let go of them once the reader has left
   it, in either direction, and pick them up again on return. The box holds
   ninety-six and the film fifty; between them they are the largest thing a
   phone is asked to keep resident. */
import { chromium } from "playwright-core";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0, 120)));
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2400); await p.click("#enterBtn", { timeout: 6000 }).catch(() => {});
await p.waitForTimeout(600);

const where = id => p.evaluate(i => { const e = document.getElementById(i).getBoundingClientRect();
  return { top: Math.round(e.top + scrollY), h: Math.round(e.height) }; }, id);
const read = () => p.evaluate(() => ({ box: { on: __box.ok, n: __box.loaded }, film: { on: __film.ok, n: __film.loaded } }));
/* walk there rather than teleport, so the observers see it, then let it settle */
const walk = async (to, settle = 1500) => {
  const from = await p.evaluate(() => scrollY);
  const d = Math.sign(to - from), n = Math.min(40, Math.ceil(Math.abs(to - from) / 700));
  for (let i = 1; i <= n; i++) {
    await p.evaluate(t => scrollTo({ top: t, behavior: "instant" }), from + (to - from) * (i / n));
    await p.waitForTimeout(30);
  }
  await p.evaluate(t => scrollTo({ top: t, behavior: "instant" }), to);
  await p.waitForTimeout(settle);
  return read();
};

const box = await where("stonepin"), film = await where("filmpin");
const boxMid = box.top + box.h / 2, filmMid = film.top + film.h / 2;

let r = await walk(boxMid);
ok(r.box.on && r.box.n > 0, `the box loads its frames while it is on screen (${r.box.n} held)`);
r = await walk(filmMid);
ok(!r.box.on && r.box.n === 0, `and lets them go once the reader is well past it (${r.box.n} held)`);
ok(r.film.on && r.film.n > 0, `the film loads its own while it is on screen (${r.film.n} held)`);
r = await walk(Math.max(0, filmMid - 844 * 5));
ok(!r.film.on && r.film.n === 0, `and lets them go when the reader is well above it (${r.film.n} held)`);
r = await walk(boxMid);
ok(r.box.on && r.box.n > 0, `the box picks its frames up again on the way back (${r.box.n} held)`);
ok(errs.length === 0, `no script errors (${errs[0] || ""})`);
console.log(`\n${pass} pass, ${fail} fail`);
await b.close();
process.exit(fail ? 1 : 0);
