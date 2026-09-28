/* The builder's questions, folded.

   Closed, each question is one row carrying its own answer. Tapping opens it
   and closes the others. Choosing updates the answer in the row. On a wide
   screen nothing folds at all. And the stylesheet leaves them open, so a
   reader without scripting keeps the builder that was always there. */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
const open = async (p, W) => {
  await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2600); await p.click("#enterBtn", { timeout: 6000 }).catch(() => {});
  await p.waitForTimeout(800);
  await p.evaluate(async () => { const s = Math.round(innerHeight * 0.7); for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 110)); } });
  await p.evaluate(() => document.getElementById("configure").scrollIntoView({ block: "start", behavior: "instant" }));
  await p.waitForTimeout(600);
};

/* ── a phone ── */
{
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0, 160)));
  await open(p, 390);
  const shut = await p.evaluate(() => {
    const g = [...document.querySelectorAll("#opts .opt")];
    return { n: g.length, open: g.filter(x => x.classList.contains("open")).length,
      h: Math.round(document.getElementById("opts").getBoundingClientRect().height),
      answers: g.map(x => (x.querySelector(".optnow") || {}).textContent || "") };
  });
  ok(shut.open === 0, `phone every question is closed to start (${shut.open} of ${shut.n} open)`);
  ok(shut.answers.every(a => a.trim().length), `phone each row carries its own answer (${shut.answers.join(" · ")})`);
  ok(shut.h < 320, `phone the questions are ${shut.h}px, not the 495 they were`);

  await p.click("#opts .opt:first-child > .k");
  await p.waitForTimeout(400);
  let st = await p.evaluate(() => {
    const g = [...document.querySelectorAll("#opts .opt")];
    return { open: g.map(x => x.classList.contains("open")),
      chips: getComputedStyle(g[0].querySelector(".chips")).display };
  });
  ok(st.open[0] && st.open.filter(Boolean).length === 1, `phone tapping one opens it and only it`);
  ok(st.chips !== "none", `phone its choices are there when it is open (${st.chips})`);

  /* choosing writes the answer back into the row */
  await p.click('#opts .chip[data-k="cut"][data-v="pear"]');
  await p.waitForTimeout(500);
  const after = await p.evaluate(() => (document.querySelector("#opts .opt .optnow") || {}).textContent);
  ok((after || "").trim().toLowerCase() === "pear", `phone choosing writes the answer into the row ("${after}")`);

  await p.click("#opts .opt:nth-child(3) > .k");
  await p.waitForTimeout(400);
  st = await p.evaluate(() => [...document.querySelectorAll("#opts .opt")].map(x => x.classList.contains("open")));
  ok(st.filter(Boolean).length === 1 && st[2], `phone opening another closes the first`);

  /* the answer must still be reachable by a thumb */
  const reach = await p.evaluate(() => {
    const k = document.querySelector("#opts .opt > .k").getBoundingClientRect();
    return Math.round(k.height);
  });
  ok(reach >= 44, `phone a question row is a thumb tall (${reach}px)`);
  ok(errs.length === 0, `phone no script errors` + (errs.length ? " :: " + errs[0] : ""));
  await p.close();
}

/* ── a desktop: nothing folds ── */
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  await open(p, 1440);
  const st = await p.evaluate(() => {
    const g = [...document.querySelectorAll("#opts .opt")];
    return { open: g.filter(x => x.classList.contains("open")).length, n: g.length,
      chips: g.every(x => getComputedStyle(x.querySelector(".chips")).display !== "none") };
  });
  ok(st.open === st.n && st.chips, `desktop nothing folds — all ${st.n} questions stay open`);
  await p.close();
}
await b.close();
console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
