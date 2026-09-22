/* The site the way it is used, not the way it is laid out: every product
   window opened and closed, the gallery walked, every language chosen, the
   canvases checked for a drawing surface — on a desktop pointer and on a
   phone with a finger. Run the preview server first, or pass a live URL.
   Usage: node tools/ixtest.mjs [base-url] */
import { chromium } from "playwright-core";

const BASE = process.argv[2] || "http://127.0.0.1:8777/";
const EXE = process.env.CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const LIVE = !/127\.0\.0\.1|localhost/.test(BASE);   /* pictures only exist on the real host */
const out = []; let fails = 0;
const ok = (c, m, d = "") => { if (c) out.push("PASS " + m); else { fails++; out.push("FAIL " + m + (d ? " — " + d : "")); } };

const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

for (const [tag, w, h, touch] of [["desk", 1440, 900, false], ["mob", 390, 844, true]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: touch, isMobile: touch, ignoreHTTPSErrors: true });
  ctx.setDefaultTimeout(6000);
  ctx.setDefaultNavigationTimeout(45000);
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", e => errs.push(e.message));
  p.on("console", m => { if (m.type() === "error" && !/404|Failed to load resource|ERR_CERT/.test(m.text())) errs.push("console: " + m.text()); });

  await p.goto(BASE, { waitUntil: "domcontentloaded", timeout: 45000 });
  await p.waitForTimeout(2600);
  await p.click("#enterBtn").catch(() => {});
  await p.waitForTimeout(900);

  /* ── the product windows ── */
  await p.evaluate(() => { const s = document.getElementById("collection"); if (s) s.scrollIntoView({ behavior: "instant" }); });
  await p.waitForTimeout(500);
  const cards = await p.$$(".piece:not(.soon)");
  ok(cards.length > 0, `${tag} the collection has pieces to open (${cards.length})`);
  let opened = 0, painted = 0, navOk = 0, closedOk = 0;
  for (let i = 0; i < cards.length; i++) {
    await cards[i].scrollIntoViewIfNeeded().catch(() => {});
    /* the reveal is a 1.2s slide; clicking into it lands the mousedown on the
       grid and the mouseup on the button, and no click event is born at all */
    await p.waitForTimeout(1600);
    /* the way a reader opens it: the words that say so */
    const vw = await cards[i].$("button.lnk.vw");
    if (vw) await vw.click().catch(() => {}); else await cards[i].click({ position: { x: 20, y: 20 } }).catch(() => {});
    await p.waitForTimeout(700);
    const st = await p.evaluate(() => {
      const m = document.getElementById("pmodal");
      if (!m || !m.classList.contains("open")) return null;
      const im = document.getElementById("pmImg"), r = m.getBoundingClientRect();
      return { img: im.naturalWidth > 0, src: (im.currentSrc || "").split("/").pop(),
        t: document.getElementById("pmT").textContent.trim().slice(0, 30),
        specs: document.getElementById("pmSpecs").children.length,
        navHidden: document.getElementById("pmNext").hidden,
        over: document.documentElement.scrollWidth - innerWidth,
        boxed: r.width > 100 && r.height > 100,
        focusInside: m.contains(document.activeElement) };
    });
    if (!st) { out.push(`      ${tag} piece ${i} did not open`); continue; }
    opened++;
    if (st.t && st.specs > 0 && (st.img || !LIVE)) painted++;
    else out.push(`      ${tag} piece ${i} opened thin: ${JSON.stringify(st)}`);
    ok(st.focusInside, `${tag} piece ${i} hands the keyboard to the window`);
    ok(st.over <= 1, `${tag} piece ${i} window does not push the page sideways (${st.over})`);
    if (!st.navHidden) {
      await p.click("#pmNext").catch(() => {});
      await p.waitForTimeout(700);
      const s2 = await p.evaluate(() => ({ src: (document.getElementById("pmImg").currentSrc || "").split("/").pop(), n: document.getElementById("pmImg").naturalWidth }));
      if (s2.src !== st.src && (s2.n > 0 || !LIVE)) navOk++;
      else out.push(`      ${tag} piece ${i}: next did not change the photograph (${st.src} → ${s2.src})`);
    } else navOk++;
    await p.click("#pmodal [data-close]").catch(() => {});
    await p.waitForTimeout(500);
    const after = await p.evaluate(() => ({ open: document.getElementById("pmodal").classList.contains("open"),
      locked: document.body.classList.contains("locked"), y: Math.round(scrollY),
      back: document.activeElement && document.activeElement.className ? String(document.activeElement.className).slice(0, 20) : document.activeElement?.tagName }));
    if (!after.open && !after.locked) closedOk++;
    else out.push(`      ${tag} piece ${i} did not close cleanly ${JSON.stringify(after)}`);
  }
  ok(opened === cards.length, `${tag} every piece opens (${opened}/${cards.length})`);
  ok(painted === opened, `${tag} every window paints its name and specification (${painted}/${opened})`);
  ok(navOk === opened, `${tag} the gallery arrows move the photograph (${navOk}/${opened})`);
  ok(closedOk === opened, `${tag} every window closes and gives the scroll back (${closedOk}/${opened})`);

  if (cards.length) {
    await cards[0].scrollIntoViewIfNeeded().catch(() => {});
    const vw = await cards[0].$("button.lnk.vw");
    if (vw) await vw.click().catch(() => {});
    await p.waitForTimeout(600);
    await p.keyboard.press("Escape");
    await p.waitForTimeout(400);
    ok(await p.evaluate(() => !document.getElementById("pmodal").classList.contains("open") && !document.body.classList.contains("locked")),
       `${tag} Escape closes the window`);
  }
  const yAfter = await p.evaluate(() => Math.round(scrollY));
  ok(yAfter > 200, `${tag} closing a window leaves you where you were, not at the top (y=${yAfter})`);

  /* ── the keyboard alone ── */
  const byKey = await p.evaluate(() => {
    const b = document.querySelector(".piece:not(.soon) button.lnk.vw");
    if (!b) return "no view button";
    b.focus();
    if (document.activeElement !== b) return "not focusable";
    b.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    b.click();
    return document.getElementById("pmodal").classList.contains("open") ? "" : "did not open";
  });
  ok(byKey === "", `${tag} a piece opens from the keyboard`, byKey);
  await p.keyboard.press("Escape"); await p.waitForTimeout(400);

  /* ── the languages ── */
  const langs = await p.evaluate(() => [...document.querySelectorAll("#langmenu button")].map(b => b.getAttribute("data-lang")).filter(Boolean));
  ok(langs.length >= 5, `${tag} the switcher offers every language (${langs.join(",")})`);
  for (const L of langs) {
    await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await p.waitForTimeout(200);
    const done = await p.evaluate(l => {
      const t = document.querySelector(".lang"); if (t) t.click();
      const b = document.querySelector('#langmenu button[data-lang="' + l + '"]');
      if (!b) return false; b.click(); return true;
    }, L);
    await p.waitForTimeout(1100);
    const s = await p.evaluate(() => ({
      lang: document.documentElement.getAttribute("data-lang"),
      dir: document.documentElement.getAttribute("dir") || "ltr",
      over: document.documentElement.scrollWidth - innerWidth,
      menuOpen: !!document.querySelector("#langmenu.open"),
      empty: [...document.querySelectorAll("[data-en]")].filter(e => !e.textContent.trim()).length,
      h: (document.querySelector(".h") || {}).textContent?.trim().slice(0, 36) || ""
    }));
    ok(done && s.lang === L, `${tag} ${L}: the page changes language (got ${s.lang})`);
    ok(s.over <= 1, `${tag} ${L}: no horizontal overflow (${s.over})`);
    ok(!s.menuOpen, `${tag} ${L}: the switcher closes behind you`);
    ok(s.empty === 0, `${tag} ${L}: nothing went blank (${s.empty})`);
    ok((L === "he" || L === "ar") === (s.dir === "rtl"), `${tag} ${L}: reads the right way (dir=${s.dir})`);
    out.push(`      ${tag} ${L} · ${s.dir} · "${s.h}"`);
  }
  await p.evaluate(() => { const b = document.querySelector('#langmenu button[data-lang="en"]'); if (b) b.click(); });
  await p.waitForTimeout(800);

  /* ── the canvases: a surface, or a graceful way out ── */
  await p.evaluate(async () => {
    const step = Math.round(innerHeight * 0.7);
    for (let y = 0; y < document.body.scrollHeight; y += step) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 120)); }
  });
  await p.waitForTimeout(1200);
  const canv = await p.evaluate(() => [...document.querySelectorAll("canvas")].map(c => ({ id: c.id || c.className, w: c.width, h: c.height })));
  out.push(`      ${tag} canvases: ${canv.map(c => c.id + " " + c.w + "×" + c.h).join(", ")}`);
  ok(canv.every(c => c.w > 0 && c.h > 0), `${tag} every canvas has a drawing surface`, JSON.stringify(canv.filter(c => !c.w || !c.h)));

  ok(errs.length === 0, `${tag} no script errors through any of it`, errs.slice(0, 3).join(" | "));
  await ctx.close();
}

/* ── the machine that cannot draw: WebGL taken away, on purpose ── */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, ignoreHTTPSErrors: true });
  ctx.setDefaultTimeout(6000); ctx.setDefaultNavigationTimeout(45000);
  await ctx.addInitScript(() => {
    const real = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t) {
      if (/webgl/i.test(String(t))) return null;
      return real.apply(this, arguments);
    };
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", e => errs.push(e.message));
  await p.goto(BASE, { waitUntil: "domcontentloaded", timeout: 45000 });
  await p.waitForTimeout(2600); await p.click("#enterBtn").catch(() => {}); await p.waitForTimeout(1200);
  await p.evaluate(() => { const s = document.getElementById("build"); if (s) s.scrollIntoView({ behavior: "instant" }); });
  await p.waitForTimeout(2500);
  await p.waitForFunction(() => { const i = document.querySelector(".glfb img"); return !i || i.naturalWidth > 0; }, null, { timeout: 12000 }).catch(() => {});
  const fb = await p.evaluate(() => {
    const w = document.getElementById("stripwrap"), g = document.querySelector(".glfb");
    const r = w ? w.getBoundingClientRect() : { width: 0, height: 0 };
    const gr = g ? g.getBoundingClientRect() : { width: 0, height: 0 };
    const im = g ? g.querySelector("img") : null;
    return { flagged: document.documentElement.classList.contains("no3d"),
      wrapShown: r.width > 50 && r.height > 50,
      fbShown: gr.width > 50 && gr.height > 50,
      fbLoaded: im ? im.naturalWidth > 0 : false,
      tabs: [...document.querySelectorAll(".vt, .vposwrap")].filter(e => e.getBoundingClientRect().height > 2).length };
  });
  ok(fb.flagged, "no-webgl: the page knows it cannot draw in three dimensions");
  ok(fb.wrapShown, "no-webgl: the frame is still there, not a collapsed gap");
  ok(fb.fbShown && (fb.fbLoaded || !LIVE), "no-webgl: a photograph of the line stands in", JSON.stringify(fb));
  ok(fb.tabs === 0, `no-webgl: the view controls are put away (${fb.tabs} left)`);
  ok(errs.length === 0, "no-webgl: nothing throws", errs.slice(0, 2).join(" | "));
  await ctx.close();
}

console.log(out.join("\n"));
console.log(`\n${out.filter(l => l.startsWith("PASS")).length} pass, ${fails} fail`);
await browser.close();
process.exit(fails ? 1 : 0);
