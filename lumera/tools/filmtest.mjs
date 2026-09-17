/* The Dubai film, checked the way it is actually used: scrolled through, at the
   widths people hold. Run the preview server first (the frames are built, not
   committed): python3 -m http.server 8777 in a directory holding the page as
   index.html and the frames under f/film/. */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const out = [];
for (const [tag, w, h] of [["1440",1440,900],["768",768,1024],["430",430,932],["390",390,844],["375",375,812],["320",320,720]]) {
  const p = await b.newPage({ viewport:{ width:w, height:h }, deviceScaleFactor:2 });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" });
  await p.waitForTimeout(2800); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
  await p.waitForTimeout(1000);

  const geo0 = await p.evaluate(() => { const c = document.getElementById("filmcv"); const r = c.getBoundingClientRect(); return { pin: document.getElementById("filmpin").offsetHeight, cw: Math.round(r.width), ch: Math.round(r.height) }; });
  const top = await p.evaluate(() => scrollY + document.getElementById("filmpin").getBoundingClientRect().top);

  /* walk the whole pin in small steps, the way a thumb does */
  const seen = [];
  const steps = 26;
  for (let i = 0; i <= steps; i++) {
    await p.evaluate(([t, ph, f, ih]) => window.scrollTo({ top: t + (ph - ih) * f, behavior:"instant" }), [top, geo0.pin, i / steps, h]);
    /* the scrub is lerp-smoothed, so the last reading has to be taken after it
       has actually converged, or the test measures its own impatience */
    await p.waitForTimeout(i === steps ? 1800 : 260);
    seen.push(await p.evaluate(() => ({ f: window.__film.frame, p: +window.__film.p.toFixed(3),
      veil: +getComputedStyle(document.querySelector("#film .fveil")).opacity,
      /* the exit is a mask sweeping up from the bottom edge, not a black veil */
      fm2: parseFloat(document.querySelector("#film .fscreen").style.getPropertyValue("--fmp")) || -5,
      sw: document.documentElement.scrollWidth,
      cw: Math.round(document.getElementById("filmcv").getBoundingClientRect().width),
      ch: Math.round(document.getElementById("filmcv").getBoundingClientRect().height) })));
  }
  const frames = seen.map(s => s.f);
  const backwards = frames.filter((f, i) => i && f < frames[i - 1] - 1).length;
  const gaps = frames.map((f, i) => i ? f - frames[i - 1] : 0).filter(d => d > 0);
  const biggest = gaps.length ? Math.max.apply(null, gaps) : 0;
  const advanced = frames[frames.length - 1] - frames[0];
  const shifted = seen.filter(s => s.cw !== geo0.cw || s.ch !== geo0.ch).length;
  const over = seen.filter(s => s.sw > w).length;
  const veilStart = seen[0].veil, veilMid = seen[Math.floor(steps / 2)].veil;
  const swStart = seen[0].fm2, swMid = seen[Math.floor(steps / 2)].fm2, swEnd = seen[steps].fm2;
  const tier = await p.evaluate(() => { const im = performance.getEntriesByType("resource").map(e => e.name).filter(n => /\/f\/film\//.test(n)); return im.length ? (im[0].indexOf("/m-") > 0 ? "m" : im[0].indexOf("/x-") > 0 ? "x" : "d") : "?"; });
  const nframes = await p.evaluate(() => performance.getEntriesByType("resource").filter(e => /\/f\/film\//.test(e.name)).length);
  const touch = await p.evaluate(() => getComputedStyle(document.querySelector("#film .fstick")).touchAction);

  out.push([
    (advanced > 30 ? "PASS" : "FAIL") + ` ${tag} the film scrubs with the page (${frames[0]} → ${frames[frames.length-1]})`,
    (backwards === 0 ? "PASS" : "FAIL") + ` ${tag} it never runs backwards (${backwards})`,
    (biggest <= Math.ceil((advanced / steps) * 2.2) ? "PASS" : "FAIL") + ` ${tag} no jumps (biggest step ${biggest} of ~${Math.round(advanced/steps)})`,
    (veilStart > 0.3 && veilStart < 0.75 && veilMid < 0.02 ? "PASS" : "FAIL") + ` ${tag} enters lit, not out of a black card (${veilStart} → ${veilMid})`,
    (swStart > -10 && swMid > -10 && swEnd <= -290 ? "PASS" : "FAIL") + ` ${tag} leaves by dissolving from the bottom (mask ${swStart}% → ${swMid}% → ${swEnd}%)`,
    (shifted === 0 ? "PASS" : "FAIL") + ` ${tag} the screen never resizes mid-scroll (${geo0.cw}x${geo0.ch})`,
    (over === 0 ? "PASS" : "FAIL") + ` ${tag} no horizontal overflow`,
    ((w <= 899 ? tier === "m" : (tier === "d" || tier === "x")) ? "PASS" : "FAIL") + ` ${tag} serves the ${tier} strip`,
    (nframes <= (w <= 899 ? 52 : 77) ? "PASS" : "FAIL") + ` ${tag} fetched ${nframes} frames`,
    (touch !== "none" ? "PASS" : "FAIL") + ` ${tag} the section does not swallow touch scroll (${touch})`,
    (errs.length === 0 ? "PASS" : "FAIL") + ` ${tag} no errors ${errs.slice(0,1).join("")}`
  ].join("\n"));
  await p.close();
}
console.log(out.join("\n"));
await b.close();
