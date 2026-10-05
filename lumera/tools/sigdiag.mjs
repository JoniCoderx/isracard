// Signature: one diagonal, light ink over black and dark ink over white, the
// writing following the scroll exactly (stops when the page stops, reverses
// when it reverses), reduced motion static, and no long hold.
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const U = process.env.U || "http://localhost:8777/", OUT = process.env.OUT || "/tmp";
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
for (const [w, h, mob] of [[1440, 900, 0], [390, 844, 1], [1920, 1080, 0]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: !!mob, hasTouch: !!mob }); const p = await c.newPage();
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(U, { waitUntil: "load" }); await p.waitForTimeout(800); await p.click("#enterBtn", { timeout: 1500 }).catch(() => {});
  await p.evaluate(() => document.documentElement.style.scrollBehavior = "auto");
  const top = await p.evaluate(() => document.getElementById("craft").getBoundingClientRect().top + scrollY);
  const prog = [];
  for (const k of [0.2, 0.45, 0.7, 1.0]) {
    await p.evaluate(([t, k]) => scrollTo(0, t - innerHeight * (1 - k)), [top, k]); await p.waitForTimeout(350);
    prog.push(await p.evaluate(() => +(window.__sig.p || 0).toFixed(3)));
    if (w !== 1920) await p.screenshot({ path: `${OUT}/sig-${w}-${k}.jpg`, type: "jpeg", quality: 70 });
  }
  ok(prog.every((v, i) => i === 0 || v >= prog[i - 1]) && prog[0] < 0.3, `${w}: writing follows the scroll down (${prog.join(" → ")})`);
  // stops when the page stops
  await p.evaluate(([t]) => scrollTo(0, t - innerHeight * 0.5), [top]); await p.waitForTimeout(120);
  const s0 = await p.evaluate(() => { const e = document.querySelector("#craft .sglite .sgbody"); return [window.__sig.p, e.style.strokeDashoffset]; });
  await p.waitForTimeout(900);
  const s1 = await p.evaluate(() => { const e = document.querySelector("#craft .sglite .sgbody"); return [window.__sig.p, e.style.strokeDashoffset]; });
  ok(s0[0] === s1[0] && s0[1] === s1[1], `${w}: stops when the page stops (${s0[1]} = ${s1[1]})`);
  // reverses
  await p.evaluate(([t]) => scrollTo(0, t - innerHeight * 0.85), [top]); await p.waitForTimeout(200);
  const s2 = await p.evaluate(() => window.__sig.p);
  ok(s2 < s1[0], `${w}: goes back with the page (${s1[0].toFixed(3)} → ${s2.toFixed(3)})`);
  // light and dark share the same dash and the same diagonal
  const g = await p.evaluate(() => { const L = document.querySelector("#craft .sglite .sgbody"), D = document.querySelector("#craft .sgdark .sgbody");
    const t = document.querySelector("#sgtop path").getAttribute("d"), bo = document.querySelector("#sgbot path").getAttribute("d"), wh = document.querySelector("#craft .sgwhite").getAttribute("d");
    const c = document.getElementById("craft"), st = c.querySelector(".sgstage");
    return { same: L.style.strokeDashoffset === D.style.strokeDashoffset && L.getAttribute("d") === D.getAttribute("d"), clip: wh === bo, blend: getComputedStyle(c.querySelector(".sgfig")).mixBlendMode, hold: c.offsetHeight - st.offsetHeight, vh: innerHeight }; });
  ok(g.same && g.clip && g.blend === "normal", `${w}: light and dark lines are one path under one diagonal (blend ${g.blend})`);
  ok(g.hold < g.vh * 0.5, `${w}: the hold is short (${g.hold}px of ${g.vh})`);
  // horizontal overflow
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${w}: nothing spills sideways`);
  ok(!errs.length, `${w}: no errors ${errs.join("|")}`);
  await c.close();
}
{ const c = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }); const p = await c.newPage();
  await p.goto(U, { waitUntil: "load" }); await p.waitForTimeout(800); await p.click("#enterBtn", { timeout: 1500 }).catch(() => {});
  await p.evaluate(() => { const e = document.getElementById("craft"); e.scrollIntoView({ block: "center" }); }); await p.waitForTimeout(500);
  const r = await p.evaluate(() => { const c = document.getElementById("craft"); return { js: c.classList.contains("sgjs"), dash: getComputedStyle(c.querySelector(".sgbody")).strokeDasharray, dot: getComputedStyle(c.querySelector(".sgdot")).opacity }; });
  ok(!r.js && r.dash === "none" && +r.dot === 1, `reduced motion: the name stands written (${JSON.stringify(r)})`);
  await p.screenshot({ path: `${OUT}/sig-reduced.jpg`, type: "jpeg", quality: 70 }); await c.close(); }
console.log(`${pass} pass, ${fail} fail`); await b.close();
