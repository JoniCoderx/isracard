// Phone flows the brief asks for: turning the phone, coming back with the
// browser's back button, the keyboard open over the form, and changing
// language on a piece page (same page, same piece). Emulated in Chromium.
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const U = process.env.U || "http://localhost:8777/";
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
const ready = async p => { await p.waitForTimeout(700); await p.evaluate(() => { const e = document.getElementById("enterBtn"); if (e) e.click(); }); await p.waitForFunction(() => !document.documentElement.classList.contains("locked"), null, { timeout: 15000 }).catch(() => {}); await p.evaluate(() => document.documentElement.style.scrollBehavior = "auto"); };
const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 }); const p = await c.newPage();
const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto(U, { waitUntil: "load" }); await ready(p);
// rotation: portrait → landscape → portrait at the collection
await p.evaluate(() => { const e = document.querySelector("#collection .pgrid"); scrollTo(0, e.getBoundingClientRect().top + scrollY - 80); }); await p.waitForTimeout(600);
const t0 = await p.evaluate(() => document.querySelector("#collection .pgrid .piece").getBoundingClientRect().top);
await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(900);
const land = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: innerWidth, inView: (() => { const r = document.querySelector("#collection").getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; })() }));
ok(land.sw <= land.w + 1 && land.inView, `landscape: no sideways spill (${land.sw}/${land.w}), still at the collection`);
await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(900);
const back = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: innerWidth, inView: (() => { const r = document.querySelector("#collection").getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; })() }));
ok(back.sw <= back.w + 1 && back.inView, `back to portrait: still at the collection, no spill`);
// back button from a piece page returns near where the reader was
const y0 = await p.evaluate(() => scrollY);
await p.evaluate(() => { const a = document.querySelector('#collection .piece a.lnk.vw'); location.href = a.href; }); await p.waitForURL(/pieces\//); await p.waitForTimeout(800);
await p.goBack(); await p.waitForTimeout(2200);
const y1 = await p.evaluate(() => scrollY);
ok(Math.abs(y1 - y0) < 600, `back from a piece: returns to the collection (scroll ${Math.round(y0)} → ${Math.round(y1)})`);
// keyboard open over the form (the visual viewport shrinks); the focused field stays visible
await p.evaluate(() => { const f = document.getElementById("concierge"); scrollTo(0, f.getBoundingClientRect().top + scrollY); }); await p.waitForTimeout(800);
const fld = await p.$("#cform input[type=text], #cform input:not([type=hidden])");
await fld.tap(); await p.setViewportSize({ width: 390, height: 500 }); await p.waitForTimeout(1200);
const kb = await p.evaluate(() => { const a = document.activeElement, r = a.getBoundingClientRect(); return { tag: a.tagName, top: Math.round(r.top), bottom: Math.round(r.bottom), h: innerHeight }; });
ok(kb.tag === "INPUT" && kb.top >= 0 && kb.bottom <= kb.h, `keyboard open: the field being typed in stays on screen (${kb.top}–${kb.bottom} of ${kb.h})`);
await p.keyboard.type("Test name"); await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(600);
ok(await p.evaluate(() => document.activeElement.value === "Test name"), "keyboard closed: what was typed is kept");
ok(!errs.length, "no page errors " + errs.join("|"));
await c.close();
// language on a piece page keeps the page and the piece, in place
{ const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const q = await c2.newPage();
  await q.goto(U + "pieces/pave/", { waitUntil: "load" }); await q.waitForTimeout(600);
  await q.evaluate(() => scrollTo(0, 600)); await q.waitForTimeout(300);
  for (const l of ["he", "ar", "fr", "en"]) {
    await q.evaluate(() => { const d = document.querySelector(".dlang"); const on = d.querySelector('[aria-pressed="true"]'); on.click(); }); await q.waitForTimeout(250);
    await q.evaluate(l => document.querySelector(`.dlang [data-lang="${l}"]`).click(), l); await q.waitForTimeout(900);
    const r = await q.evaluate(() => ({ path: location.pathname + location.search, lang: document.documentElement.lang, y: Math.round(scrollY), h1: document.querySelector("h1").textContent.trim() }));
    ok(/pieces\/pave\//.test(r.path) && r.lang === l && /SOUL/.test(r.h1) && Math.abs(r.y - 600) < 120, `piece page → ${l}: same piece (${r.path}), "${r.h1}", scroll ${r.y}`);
  }
  await c2.close(); }
console.log(`${pass} pass, ${fail} fail`); await b.close();
