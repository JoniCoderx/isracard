/* Can a thumb get down the page?

   Chromium's gesture synthesis will not honour touch-action faithfully enough
   to trust, so this does not pretend to swipe. It audits the things that
   actually stop a finger, which is better: a real phone obeys these rules
   exactly, and an audit cannot flake.

   What stops a finger, in order of how often it happens:
     · an element with touch-action:none big enough to land on — the browser
       will not scroll a gesture that starts there, full stop
     · something fixed and opaque lying over the page with pointer-events on
     · the scroll lock left on after a window closed
     · a pinned chapter whose sticky screen swallows the gesture

   Usage: node tools/thumbtest.mjs [base-url] */
import { chromium } from "playwright-core";

const BASE = process.argv[2] || "http://127.0.0.1:8777/";
const EXE = process.env.CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const out = []; let fails = 0;
const ok = (c, m, d = "") => { if (c) out.push("PASS " + m); else { fails++; out.push("FAIL " + m + (d ? " — " + d : "")); } };

const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

for (const [tag, w, h] of [["mob", 390, 844], ["small", 320, 720], ["tab", 768, 1024]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, ignoreHTTPSErrors: true });
  ctx.setDefaultNavigationTimeout(45000);
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil: "domcontentloaded", timeout: 45000 });
  await p.waitForTimeout(2600);
  await p.click("#enterBtn").catch(() => {});
  await p.waitForTimeout(1200);
  /* everything that builds itself on the way down has to exist before it can
     be judged — the bracelet canvas is not sized until its chapter arrives */
  await p.evaluate(async () => {
    const s = Math.round(innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 100)); }
    scrollTo({ top: 0, behavior: "instant" });
  });
  await p.waitForTimeout(1200);

  /* ── 1. dead zones: touch-action:none on anything a thumb can land on ── */
  const dead = await p.evaluate(() => {
    const vh = innerHeight, out = [];
    for (const e of document.querySelectorAll("*")) {
      if (getComputedStyle(e).touchAction !== "none") continue;
      const r = e.getBoundingClientRect();
      /* small controls are fine — a thumb that lands on a 30px handle meant it */
      if (r.width < 44 || r.height < 44) continue;
      out.push(`${e.id ? "#" + e.id : "." + String(e.className).split(" ")[0]} ${Math.round(r.width)}×${Math.round(r.height)} (${Math.round(r.height / vh * 100)}% of the screen)${e.closest(".modal") ? " in a window" : ""}`);
    }
    return out;
  });
  ok(dead.length === 0, `${tag} nothing large refuses to let the page scroll`, dead.join(" | "));

  /* ── 2. nothing fixed is lying across the page catching gestures ── */
  const blankets = await p.evaluate(() => {
    const out = [];
    for (const e of document.querySelectorAll("*")) {
      const cs = getComputedStyle(e);
      if (cs.position !== "fixed" || cs.pointerEvents === "none") continue;
      if (cs.visibility === "hidden" || +cs.opacity < 0.02 || cs.display === "none") continue;
      const r = e.getBoundingClientRect();
      if (r.width < innerWidth * 0.9 || r.height < innerHeight * 0.9) continue;
      if (e.closest(".modal.open") || e.id === "menu" && e.classList.contains("open")) continue;
      out.push((e.id ? "#" + e.id : "." + String(e.className).split(" ")[0]) + " " + Math.round(r.width) + "×" + Math.round(r.height));
    }
    return out;
  });
  ok(blankets.length === 0, `${tag} nothing is lying across the page catching gestures`, blankets.join(" | "));

  /* ── 3. the scroll lock is off when no window is open ── */
  const locked = await p.evaluate(() => ({
    html: document.documentElement.classList.contains("locked"),
    body: document.body.classList.contains("locked"),
    open: !!document.querySelector(".modal.open, #menu.open")
  }));
  ok(!locked.html && !locked.body, `${tag} the page is not left locked at rest`, JSON.stringify(locked));

  /* ── 4. opening a window and closing it gives the scroll back ── */
  const gaveBack = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const b = document.querySelector(".piece:not(.soon) button.lnk.vw");
    if (!b) return "no piece to open";
    b.scrollIntoView({ block: "center", behavior: "instant" }); await wait(300);
    b.click(); await wait(700);
    if (!document.querySelector(".modal.open")) return "did not open";
    const wasLocked = document.documentElement.classList.contains("locked");
    document.querySelector("#pmodal [data-close]").click(); await wait(700);
    const still = document.documentElement.classList.contains("locked") || document.body.classList.contains("locked");
    return wasLocked && !still ? "" : `locked on open: ${wasLocked}, still locked after close: ${still}`;
  });
  ok(gaveBack === "", `${tag} a window takes the scroll and hands it straight back`, gaveBack);

  /* ── 5. the pinned chapters still let the page through ── */
  const pins = await p.evaluate(() => [...document.querySelectorAll(".pin, .wpin")].map(e => {
    const st = e.querySelector(".fstick, .screen, [class*=stick]") || e;
    return { id: e.id || String(e.className).slice(0, 18), ta: getComputedStyle(st).touchAction,
      screens: +(e.offsetHeight / innerHeight).toFixed(2) };
  }));
  ok(pins.every(x => x.ta !== "none"), `${tag} no pinned chapter swallows the scroll`, JSON.stringify(pins.filter(x => x.ta === "none")));
  out.push(`      ${tag} pins: ${pins.map(x => x.id + " " + x.screens + " screens").join(", ")}`);

  await ctx.close();
}

console.log(out.join("\n"));
console.log(`\n${out.filter(l => l.startsWith("PASS")).length} pass, ${fails} fail`);
await browser.close();
process.exit(fails ? 1 : 0);
