/* The builder on a phone.

   "Messy" turned out to be four measurable things, and each of them is a
   check here so none of them can come back:
     - the questions were visible THROUGH the sticky bracelet and view bar,
     - the view tabs and the stage button sat on top of the piece,
     - the specification and estimate blocks were centred while every label
       beside them started at the left,
     - a line of facts wrapped to five lines and left its separators
       dangling at the right margin. */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };

/* one viewport per run keeps a run inside a couple of minutes; pass a width */
const ONLY = Number(process.argv[2] || 0);
const VIEWS = ONLY ? [[ONLY, ONLY < 360 ? 568 : 844]] : [[390, 844], [320, 568]];
for (const [W, H] of VIEWS) {
  const p = await b.newPage({ viewport: { width: W, height: H }, isMobile: true, hasTouch: true,
    deviceScaleFactor: 1, reducedMotion: "reduce" });   /* 1x: a leak reads the same and the compare is four times cheaper */
  const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0, 160)));
  await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2600); await p.click("#enterBtn").catch(() => {});
  await p.waitForTimeout(900);
  await p.evaluate(async () => { const s = Math.round(innerHeight * 0.7); for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 120)); } });
  const base = await p.evaluate(() => document.getElementById("configure").getBoundingClientRect().top + scrollY);
  const tag = `${W}`;

  /* ── nothing shows through the sticky builder ── */
  const px = async buf => p.evaluate(b64 => new Promise(res => {
    const im = new Image();
    im.onload = () => { const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
      const g = c.getContext("2d"); g.drawImage(im, 0, 0);
      res({ w: c.width, h: c.height, d: Array.from(g.getImageData(0, 0, c.width, c.height).data) }); };
    im.src = "data:image/png;base64," + b64;
  }), buf.toString("base64"));
  let worst = 0, worstAt = 0;
  for (const off of [200, 450, 700, 950]) {
    await p.evaluate(v => scrollTo({ top: v, behavior: "instant" }), base + off);
    await p.waitForTimeout(650);
    const band = await p.evaluate(() => {
      const s = document.getElementById("stripwrap").getBoundingClientRect();
      const v = document.querySelector(".vposwrap").getBoundingClientRect();
      return { x: 0, y: Math.round(s.top), width: innerWidth, height: Math.max(1, Math.round(v.bottom - s.top)) };
    });
    if (band.height < 20) continue;
    const before = await p.screenshot({ clip: band });
    await p.evaluate(() => { for (const s of ["#opts", ".total", "#carat"]) { const e = document.querySelector(s); if (e) e.style.visibility = "hidden"; } });
    await p.waitForTimeout(350);
    const after = await p.screenshot({ clip: band });
    await p.evaluate(() => { for (const s of ["#opts", ".total", "#carat"]) { const e = document.querySelector(s); if (e) e.style.visibility = ""; } });
    const A = await px(before), B = await px(after);
    let d = 0;
    for (let i = 0; i < A.d.length; i += 4)
      if (Math.abs(A.d[i] - B.d[i]) > 8 || Math.abs(A.d[i+1] - B.d[i+1]) > 8 || Math.abs(A.d[i+2] - B.d[i+2]) > 8) d++;
    const pct = d / (A.w * A.h) * 100;
    if (pct > worst) { worst = pct; worstAt = off; }
  }
  ok(worst < 0.05, `${tag} the questions do not show through the sticky builder (worst ${worst.toFixed(3)}% at +${worstAt})`);

  await p.evaluate(v => scrollTo({ top: v, behavior: "instant" }), base - 60);
  await p.waitForTimeout(800);

  /* ── the controls are not sitting on the piece ── */
  const fit = await p.evaluate(() => {
    const s = document.getElementById("stripwrap").getBoundingClientRect();
    const r = {};
    for (const sel of [".vt", ".stbtn"]) {
      const e = document.querySelector("#stripwrap " + sel);
      if (!e || getComputedStyle(e).display === "none") { r[sel] = null; continue; }
      const b = e.getBoundingClientRect();
      r[sel] = { w: Math.round(b.width), h: Math.round(b.height),
        inside: b.left >= s.left - 1 && b.right <= s.right + 1 && b.top >= s.top - 1 && b.bottom <= s.bottom + 1,
        frac: (b.width * b.height) / (s.width * s.height) };
    }
    r.strip = { w: Math.round(s.width), h: Math.round(s.height) };
    return r;
  });
  const furniture = [".vt", ".stbtn"].map(k => fit[k]).filter(Boolean);
  ok(furniture.every(f => f.inside), `${tag} the controls stay inside the frame`);
  const share = furniture.reduce((a, f) => a + f.frac, 0);
  ok(share < 0.20, `${tag} the controls take less than a fifth of the frame (${(share * 100).toFixed(1)}% of ${fit.strip.w}x${fit.strip.h})`);

  /* ── one rhythm: everything starts at the same edge ── */
  const edges = await p.evaluate(() => {
    const L = document.getElementById("configure").getBoundingClientRect().left;
    const at = s => { const e = document.querySelector(s); return e ? getComputedStyle(e).textAlign : null; };
    return { carat: at("#carat"), tot: at("#configure .tot"), label: at("#opts .opt .k") };
  });
  ok(edges.carat === edges.label && edges.tot === edges.label,
    `${tag} the blocks and the labels start at the same edge (carat ${edges.carat}, estimate ${edges.tot}, labels ${edges.label})`);

  /* ── no separator left dangling at a wrap ── */
  const seps = await p.evaluate(() => {
    const row = document.querySelector("#configure .tot .row");
    if (!row) return { n: 0, shown: 0 };
    const kids = [...row.children];
    const shown = kids.filter(e => e.tagName === "I" && getComputedStyle(e).display !== "none").length;
    const lines = new Set(kids.filter(e => getComputedStyle(e).display !== "none").map(e => Math.round(e.getBoundingClientRect().top))).size;
    return { n: kids.filter(e => e.tagName === "I").length, shown, lines };
  });
  ok(seps.shown === 0 || seps.lines <= 1,
    `${tag} the facts do not leave separators hanging (${seps.shown} shown across ${seps.lines} lines)`);

  /* ── no two identical section rules stacked with nothing between ── */
  const dbl = await p.evaluate(() => {
    const rules = [];
    document.querySelectorAll("#configure *").forEach(e => {
      const c = getComputedStyle(e), b = e.getBoundingClientRect();
      if (b.width < 300) return;
      if (parseFloat(c.borderTopWidth) > 0) rules.push({ y: Math.round(b.top), c: c.borderTopColor });
      if (parseFloat(c.borderBottomWidth) > 0) rules.push({ y: Math.round(b.bottom), c: c.borderBottomColor });
    });
    rules.sort((a, b) => a.y - b.y);
    let n = 0;
    for (let i = 1; i < rules.length; i++)
      if (rules[i].y - rules[i-1].y < 24 && rules[i].c === rules[i-1].c) n++;
    return { n, total: rules.length };
  });
  ok(dbl.n === 0, `${tag} no section rule is drawn twice (${dbl.n} doubled of ${dbl.total})`);

  ok(errs.length === 0, `${tag} no script errors` + (errs.length ? " :: " + errs[0] : ""));
  await p.close();
}
await b.close();
console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
