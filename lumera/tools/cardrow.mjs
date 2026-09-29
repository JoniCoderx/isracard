/* Two cards side by side are one object: same top, same bottom, and the price
   and the link on one line across the row. An odd card lies on its side rather
   than leaving half a row empty. */
import { chromium } from "playwright-core";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const W of [390, 360, 320]) {
  const p = await b.newPage({ viewport: { width: W, height: 800 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0, 120)));
  await p.goto("http://127.0.0.1:8777/", { waitUntil: "networkidle" });
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let v = 0; v < total; v += 300) { await p.evaluate(x => scrollTo({ top: x, behavior: "instant" }), v); await p.waitForTimeout(40); }
  await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    const cards = [...document.querySelectorAll("#collection .pgrid .piece")].filter(c => !c.hidden);
    const Y = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { t: Math.round(b.top + scrollY), b: Math.round(b.bottom + scrollY) }; };
    const rows = {};
    cards.forEach(c => { const y = Y(c).t; (rows[y] = rows[y] || []).push({
      card: Y(c), fig: Y(c.querySelector(".fig")), bd: Y(c.querySelector(".bd")),
      meta: Y(c.querySelector(".meta")), acts: Y(c.querySelector(".acts")),
      lone: c.classList.contains("lone"), w: Math.round(c.getBoundingClientRect().width) }); });
    return { n: cards.length, rows: Object.values(rows), gridW: Math.round(document.querySelector("#collection .pgrid").getBoundingClientRect().width) };
  });
  const pairs = r.rows.filter(x => x.length === 2);
  const same = (a, b2, k) => a[k] && b2[k] && a[k].t === b2[k].t && a[k].b === b2[k].b;
  ok(pairs.length > 0, `${W} the catalogue is laid out two across (${pairs.length} full rows of ${r.n} cards)`);
  ok(pairs.every(([a, c]) => same(a, c, "fig")), `${W} both pictures in a row start and end together`);
  /* only the top is judged: a card still to come carries no price and no link,
     so the foot of its body is an empty box edge nobody sees */
  ok(pairs.every(([a, c]) => a.bd && c.bd && a.bd.t === c.bd.t), `${W} both bodies in a row start flush under the picture`);
  ok(pairs.every(([a, c]) => !a.meta || same(a, c, "meta")), `${W} the price sits on one line across the row`);
  ok(pairs.every(([a, c]) => !a.acts || same(a, c, "acts")), `${W} the link sits on one line across the row`);
  const singles = r.rows.filter(x => x.length === 1);
  ok(singles.every(([s]) => s.lone && s.w > r.gridW * 0.9),
    `${W} an odd card fills its row rather than leaving half of one empty (${singles.length} single${singles.length === 1 ? "" : "s"})`);
  ok(errs.length === 0, `${W} no script errors`);
  await p.close();
}
console.log(`\n${pass} pass, ${fail} fail`);
await b.close();
process.exit(fail ? 1 : 0);
