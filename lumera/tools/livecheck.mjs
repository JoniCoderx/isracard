/* The live site, from outside. Everything here is a fact the local copy
   cannot give: the CI-built photographs and frame strips, the fonts over the
   network, the real payload, and whether the page a reader gets is the page
   that was built.
   Usage: node tools/livecheck.mjs [url] */
import { chromium } from "playwright-core";
const BASE = process.argv[2] || "https://jonicoderx.github.io/isracard/";
const EXE = process.env.CHROME || "/ms-playwright/chromium-1228/chrome-linux64/chrome";
const out = []; let fails = 0;
const ok = (c, m, d = "") => { if (c) out.push("PASS " + m); else { fails++; out.push("FAIL " + m + (d ? " — " + d : "")); } };
const b = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

for (const [tag, w, h, mob] of [["desk", 1440, 900, false], ["mob", 390, 844, true]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const bad = [], errs = [];
  let bytes = 0;
  p.on("requestfailed", r => bad.push(r.url().split("/").pop() + " " + (r.failure() || {}).errorText));
  p.on("response", async r => {
    if (r.status() >= 400) bad.push(r.status() + " " + r.url().split("/").pop());
    const len = +(r.headers()["content-length"] || 0); bytes += len;
  });
  p.on("pageerror", e => errs.push(String(e).slice(0, 140)));
  p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 120)); });
  await p.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await p.waitForTimeout(3500);
  await p.click("#enterBtn", { timeout: 6000 }).catch(() => {});
  await p.waitForTimeout(1500);
  await p.evaluate(async () => { const s = Math.round(innerHeight * 0.8); for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 160)); } });
  await p.waitForTimeout(2000);

  const st = await p.evaluate(() => ({
    fonts: [...new Set([...document.fonts].filter(f => f.status === "loaded").map(f => f.family))],
    screens: +(document.body.scrollHeight / innerHeight).toFixed(2),
    cards: document.querySelectorAll("#collection .pgrid .piece").length,
    rows: new Set([...document.querySelectorAll("#collection .pgrid .piece")].map(e => Math.round(e.getBoundingClientRect().top))).size,
    wrap: document.querySelectorAll("#collection .pgrid .wrapln").length,
    mark: !!document.querySelector("#stripwrap .bgmk"),
    handbar: !!document.getElementById("handbar"),
    chip: (() => { const c = document.querySelector(".cat.on"); if (!c) return null; const cs = getComputedStyle(c); return cs.color + " on " + cs.backgroundColor; })(),
    /* an <img> that carries only data-src has never been asked to load, so it
       is complete with a natural width of zero and is not a failure — only
       one that resolved a source and came back empty is */
    imgs: [...document.querySelectorAll("img")].filter(i => i.currentSrc && !i.complete).length,
    blank: [...document.querySelectorAll("img")].filter(i => i.currentSrc && i.complete && i.naturalWidth === 0).length
  }));
  ok(st.fonts.length >= 2, `${tag} webfonts loaded`, st.fonts.join(", "));
  ok(bad.length === 0, `${tag} nothing 404s or fails`, bad.slice(0, 5).join(" | "));
  ok(errs.length === 0, `${tag} no console or page errors`, errs.slice(0, 3).join(" | "));
  ok(st.blank === 0 && st.imgs === 0, `${tag} every image decoded`, `${st.blank} blank, ${st.imgs} undecoded`);
  ok(st.cards === 5, `${tag} five pieces in the collection`, String(st.cards));
  ok(st.wrap === 5, `${tag} every piece has its wrapping hairline`, String(st.wrap));
  ok(st.mark, `${tag} the house mark sits behind the render`);
  ok(st.handbar, `${tag} the hand controls exist`);
  out.push(`      ${tag} ${st.screens} screens, ${Math.round(bytes / 1024)} KB declared, chip ${st.chip}`);

  /* the bracelet, then the hand on it */
  await p.evaluate(() => document.getElementById("stripwrap").scrollIntoView({ block: "center", behavior: "instant" }));
  await p.waitForTimeout(1200);
  const tabs = await p.$$(".vt .vtb");
  if (tabs[1]) await tabs[1].click();
  await p.waitForTimeout(4000);
  const hand = await p.evaluate(() => {
    const cv = document.getElementById("bcv");
    const on = document.getElementById("stripwrap").classList.contains("wrist");
    const bar = document.getElementById("handbar");
    const br = bar ? bar.getBoundingClientRect() : null;
    const api = typeof window.__hand === "function" ? window.__hand() : null;
    return { on, canvas: cv ? cv.width + "x" + cv.height : "none",
      barVisible: br ? (br.top > -1 && br.bottom < innerHeight + 1 && br.height > 10) : false,
      barTop: br ? Math.round(br.top) : null, api };
  });
  ok(hand.on, `${tag} the wrist view turns on`);
  ok(!!hand.api, `${tag} the hand answers`, JSON.stringify(hand.api));
  ok(hand.barVisible, `${tag} the hand controls are on screen with the hand`, "top=" + hand.barTop);
  /* The canvas has to have something in it, not just be sized. readPixels is
     no use here — the drawing buffer is not preserved, so it reads back empty
     however good the frame was. The screenshot is what a reader sees, and a
     PNG of a hand is an order of magnitude larger than a PNG of nothing. */
  /* the bracelet drifts on its own now, so an element screenshot sits waiting
     for a box that will never be "stable"; a clip does not care */
  const cbox = await (await p.$("#bcv")).boundingBox();
  const shot = await p.screenshot({ clip: cbox });
  await import("node:fs").then(fs => fs.writeFileSync(`hand-${tag}.png`, shot));
  ok(shot.length > 12000, `${tag} the hand is actually drawn`, `${Math.round(shot.length / 1024)} KB of canvas`);
  if (mob) {
    /* the stage: the only surface where a drag can only mean one thing */
    const cdp = await ctx.newCDPSession(p);
    const bx = await (await p.$("#bcv")).boundingBox();
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: bx.x + bx.width / 2, y: bx.y + bx.height / 2, id: 1 }] });
    await p.waitForTimeout(60);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await p.waitForTimeout(1400);
    const sg = await p.evaluate(() => ({
      open: !!document.querySelector(".bstage.open"),
      ta: getComputedStyle(document.getElementById("bcv")).touchAction,
      full: document.getElementById("bcv").getBoundingClientRect().height > 600,
      locked: document.documentElement.classList.contains("locked")
    }));
    ok(sg.open && sg.full, "mob a tap opens the piece full screen", JSON.stringify(sg));
    ok(sg.ta === "none" && sg.locked, "mob the drag is free there and the page is held", JSON.stringify(sg));
    await p.click(".stclose").catch(() => {});
    await p.waitForTimeout(900);
    ok(!(await p.evaluate(() => !!document.querySelector(".bstage.open"))), "mob it closes again");
    const opts = await p.evaluate(() => { const o = document.getElementById("opts"); return o ? Math.round(o.getBoundingClientRect().height) : -1; });
    ok(opts > 0 && opts < 560, `mob the builder panel is under 560px`, String(opts));
    out.push(`      mob builder panel ${opts}px of ${h}`);
  }
  await ctx.close();
}
console.log(out.join("\n"));
console.log(`\n${out.filter(l => l.startsWith("PASS")).length} pass, ${fails} fail`);
await b.close();
process.exit(fails ? 1 : 0);
