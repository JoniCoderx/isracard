/* The journey: six stages of one bracelet in one frame, under a screen, that
   plays on its own and stops the moment anyone takes hold of it. */
import { chromium } from "playwright-core";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });

for (const [W, H, tag] of [[1440, 900, "desk"], [390, 844, "phone"]]) {
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0, 120)));
  const got = new Map();
  p.on("response", r => { const u = r.url(); if (/\/img\/jn\d-/.test(u)) got.set(u, (got.get(u) || 0) + 1); });
  await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2400); await p.click("#enterBtn", { timeout: 6000 }).catch(() => {});
  await p.waitForTimeout(600);
  const sec = await p.evaluate(() => { const e = document.getElementById("bespoke").getBoundingClientRect();
    return { top: Math.round(e.top + scrollY), h: Math.round(e.height) }; });
  ok(sec.h <= H * 1.45, `${tag} the chapter is about one screen (${sec.h}px of ${H})`);

  for (let v = 0; v < sec.top; v += 500) { await p.evaluate(t => scrollTo({ top: t, behavior: "instant" }), v); await p.waitForTimeout(40); }
  await p.evaluate(t => scrollTo({ top: t, behavior: "instant" }), sec.top - 60);
  await p.waitForTimeout(700);

  const one = () => p.evaluate(() => ({
    shots: document.querySelectorAll(".jshot.on").length,
    steps: document.querySelectorAll(".jstep.on").length,
    i: [...document.querySelectorAll(".jshot")].findIndex(s => s.classList.contains("on")) }));
  let st = await one();
  ok(st.shots === 1 && st.steps === 1, `${tag} one photograph and one stage showing (${st.shots}, ${st.steps})`);
  ok(await p.evaluate(() => document.querySelectorAll(".jshot").length) === 6, `${tag} all six live in the one frame`);

  /* it plays on its own */
  const before = st.i;
  await p.waitForTimeout(5200);
  const after = (await one()).i;
  ok(after !== before, `${tag} it moves on by itself (${before} → ${after})`);

  /* and stops the moment it is touched */
  await p.evaluate(() => document.querySelectorAll(".jdot")[2].click());
  await p.waitForTimeout(200);
  const picked = (await one()).i;
  ok(picked === 2, `${tag} a stage can be chosen (landed on ${picked})`);
  await p.waitForTimeout(5200);
  ok((await one()).i === 2, `${tag} and it stays there once chosen`);

  /* keyboard */
  await p.evaluate(() => document.querySelectorAll(".jdot")[0].focus());
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(300);
  const kb = await p.evaluate(() => [...document.querySelectorAll(".jdot")].indexOf(document.activeElement));
  ok(kb === 1 && (await one()).i === 1, `${tag} arrow keys move it (focus ${kb})`);

  const twice = [...got.entries()].filter(([, n]) => n > 1);
  ok(twice.length === 0, `${tag} no photograph fetched twice (${twice.length})`);
  const ratio = await p.evaluate(() => getComputedStyle(document.querySelector(".jim")).aspectRatio);
  ok(/4\s*\/\s*3/.test(ratio), `${tag} the frame reserves its space (${ratio})`);
  ok(errs.length === 0, `${tag} no script errors (${errs[0] || ""})`);
  await p.close();
}
console.log(`\n${pass} pass, ${fail} fail`);
await b.close();
process.exit(fail ? 1 : 0);
