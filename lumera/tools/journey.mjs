/* The journey chapter: one stage that holds still on a wide screen while six
   chapters pass it, six figures that move into those chapters on a phone, a
   progress indicator that can be used with a keyboard, and no photograph
   fetched twice. */
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
  const top = await p.evaluate(() => Math.round(document.getElementById("jrn").getBoundingClientRect().top + scrollY));
  for (let y = 0; y < top + 400; y += 300) { await p.evaluate(v => scrollTo({ top: v, behavior: "instant" }), y); await p.waitForTimeout(50); }
  await p.waitForTimeout(700);

  const home = await p.evaluate(() => [...document.querySelectorAll(".jshot")].map(s =>
    s.parentElement.classList.contains("jstage") ? "stage" : s.parentElement.classList.contains("jstep") ? "step" : "?"));
  if (tag === "desk") ok(home.every(h => h === "stage"), `${tag} all six figures live in the stage (${home.join(",")})`);
  else ok(home.every(h => h === "step"), `${tag} each figure sits in its own chapter (${home.join(",")})`);

  ok(await p.evaluate(() => document.querySelectorAll(".jstep").length) === 6, `${tag} six chapters`);
  const dotsVisible = await p.evaluate(() => { const n = document.querySelector(".jdots"); return n && n.getBoundingClientRect().height > 0; });
  ok(tag === "desk" ? dotsVisible : !dotsVisible, `${tag} the indicator is ${tag === "desk" ? "shown" : "left off the phone"}`);

  if (tag === "desk") {
    /* the stage holds still while the chapters pass it */
    const sticky = await p.evaluate(() => getComputedStyle(document.querySelector(".jstage")).position);
    ok(sticky === "sticky", `${tag} the stage holds still (${sticky})`);
    const seen = new Set();
    const total = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = top - 200; y < top + 3400 && y < total - H; y += 180) {
      await p.evaluate(v => scrollTo({ top: v, behavior: "instant" }), y); await p.waitForTimeout(240);
      const i = await p.evaluate(() => [...document.querySelectorAll(".jshot")].findIndex(s => s.classList.contains("on")));
      if (i >= 0) seen.add(i);
    }
    ok(seen.size >= 5, `${tag} scrolling the chapter moves through its stages (${[...seen].sort().join(",")})`);
    /* direct selection, and from the keyboard */
    await p.evaluate(() => document.querySelectorAll(".jdot")[3].click());
    await p.waitForTimeout(1100);
    const picked = await p.evaluate(() => [...document.querySelectorAll(".jdot")].findIndex(d => d.classList.contains("on")));
    ok(picked === 3, `${tag} a stage can be chosen directly (landed on ${picked})`);
    await p.evaluate(() => document.querySelectorAll(".jdot")[0].focus());
    await p.keyboard.press("ArrowRight"); await p.waitForTimeout(900);
    const kb = await p.evaluate(() => document.activeElement.classList.contains("jdot") && [...document.querySelectorAll(".jdot")].indexOf(document.activeElement));
    ok(kb === 1, `${tag} and with an arrow key (focus on ${kb})`);
    /* only one photograph is shown at a time */
    const on = await p.evaluate(() => document.querySelectorAll(".jshot.on").length);
    ok(on === 1, `${tag} one photograph on the stage at a time (${on})`);
  }

  /* nothing is fetched twice, and nothing is laid out without reserved space */
  const twice = [...got.entries()].filter(([, n]) => n > 1);
  ok(twice.length === 0, `${tag} no photograph fetched twice (${twice.length})`);
  const ratio = await p.evaluate(() => { const n = document.querySelector(".jim"); const c = getComputedStyle(n); return c.aspectRatio; });
  ok(/4\s*\/\s*3/.test(ratio), `${tag} the frame reserves its space before the photograph lands (${ratio})`);
  ok(errs.length === 0, `${tag} no script errors (${errs[0] || ""})`);
  await p.close();
}
console.log(`\n${pass} pass, ${fail} fail`);
await b.close();
process.exit(fail ? 1 : 0);
