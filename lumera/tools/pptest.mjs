// The piece pages: gallery (arrows, thumbnails, keyboard, swipe), enlarged
// view (opens at the original, Escape, focus back), layout (about 60/40, contain,
// no forced screen height), "Price on request" once, and the enquiry carrying
// the piece by name and reference into the form, entering the piece page
// directly, in every language. Descriptions and button names translated.
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const U = process.env.U || "http://localhost:8777/";
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
for (const id of ["ring", "knot", "pave"]) {
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await c.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(U + "pieces/" + id + "/", { waitUntil: "load" }); await p.waitForTimeout(600);
  const L = await p.evaluate(() => { const g = document.querySelector(".ppgal").getBoundingClientRect(), t = document.querySelector(".pptext").getBoundingClientRect(), im = document.querySelector(".ppslide img");
    const txt = document.querySelector("main").innerText; return { gw: g.width, tw: t.width, fit: getComputedStyle(im).objectFit, price: (txt.match(/Price on request/g) || []).length, lede: document.querySelector(".pptext .lede").getBoundingClientRect().width, n: document.querySelectorAll(".ppslide").length, enq: document.querySelector(".ppenq").getAttribute("href") }; });
  ok(L.gw / (L.gw + L.tw) > 0.55 && L.gw / (L.gw + L.tw) < 0.65 && L.fit === "contain" && L.price === 1 && L.lede < 620, `${id}: gallery ${Math.round(L.gw / (L.gw + L.tw) * 100)}% / text, contain, "Price on request" ${L.price}×, line ${Math.round(L.lede)}px`);
  await p.click(".ppstage .ppnext"); await p.waitForTimeout(700);
  let s = await p.evaluate(() => ({ cur: document.querySelector(".ppcur").textContent, th: [...document.querySelectorAll(".ppth")].findIndex(t => t.classList.contains("on")) }));
  ok(s.cur === "2" && s.th === 1, `${id}: arrow moves to 2 (thumb ${s.th + 1})`);
  await p.click(`.ppth[data-i="${L.n - 1}"]`); await p.waitForTimeout(700);
  s = await p.evaluate(() => document.querySelector(".ppcur").textContent); ok(s === String(L.n), `${id}: thumbnail goes to ${s}`);
  await p.focus(".pptrack"); await p.keyboard.press("ArrowRight"); await p.waitForTimeout(700);
  s = await p.evaluate(() => document.querySelector(".ppcur").textContent); ok(s === "1", `${id}: keyboard wraps to ${s}`);
  await p.click(".ppslide .ppzoom >> nth=0"); await p.waitForTimeout(500);
  const z = await p.evaluate(() => { const bx = document.getElementById("ppbox"), im = bx.querySelector("img"); return { open: !bx.hidden, src: im.getAttribute("src"), focus: document.activeElement.className }; });
  ok(z.open && /-1254\.jpg$/.test(z.src) && z.focus === "ppx", `${id}: enlarged view at the original (${z.src}), focus on close`);
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  const zc = await p.evaluate(() => ({ hidden: document.getElementById("ppbox").hidden, focus: document.activeElement.className }));
  ok(zc.hidden && /ppzoom/.test(zc.focus), `${id}: Escape closes, focus returns (${zc.focus})`);
  ok(!errs.length, `${id}: no errors ${errs.join("|")}`);
  await c.close();
}
// phone: swipe, name and enquiry right after the photograph
{ const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const p = await c.newPage();
  await p.goto(U + "pieces/ring/", { waitUntil: "load" }); await p.waitForTimeout(600);
  const r = await p.evaluate(() => { const st = document.querySelector(".ppstage").getBoundingClientRect(), h1 = document.querySelector(".pptext h1").getBoundingClientRect(), e = document.querySelector(".ppenq").getBoundingClientRect(); return { st, h1: h1.top - st.bottom, enq: e.top + scrollY, w: st.width, vw: innerWidth }; });
  ok(r.h1 < 120 && r.enq < 1500 && r.w > r.vw - 60, `phone: name ${Math.round(r.h1)}px under the photograph, enquiry at ${Math.round(r.enq)}px, stage ${Math.round(r.w)}px`);
  await p.evaluate(() => { const t = document.querySelector(".pptrack"); t.scrollTo({ left: t.clientWidth * 2, behavior: "auto" }); }); await p.waitForTimeout(500);
  ok(await p.evaluate(() => document.querySelector(".ppcur").textContent === "3" && document.querySelectorAll(".ppdots i")[2].classList.contains("on")), "phone: swiping updates the count and dots");
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "phone: nothing spills sideways");
  await c.close(); }
// enquiry: name and reference reach the form, in every language, entering the piece page directly
for (const [lang, start, name, ref] of [["en", "pieces/ring/", "SILAVU ICON Ring", "SLV·R·001"], ["he", "he/pieces/ring/", "טבעת SILAVU ICON", "SLV·R·001"], ["fr", "pieces/ring/?lang=fr", "Bague SILAVU ICON", "SLV·R·001"], ["ar", "pieces/ring/?lang=ar", "خاتم SILAVU ICON", "SLV·R·001"], ["ru", "pieces/pave/?lang=ru", "Колье SILAVU SOUL", "SLV·N·003"]]) {
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await c.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(U + start, { waitUntil: "load" }); await p.waitForTimeout(900);
  const alts = await p.evaluate(() => [...document.querySelectorAll(".ppslide img")].map(i => i.alt));
  const aria = await p.evaluate(() => document.querySelector(".ppstage .ppnext").getAttribute("aria-label"));
  if (lang === "fr" || lang === "ar" || lang === "ru") ok(alts.every(a => a && !/^The |^SILAVU engraved/.test(a)) && !/^Next/.test(aria), `${lang}: photographs described in ${lang} ("${alts[1]}") and buttons named ("${aria}")`);
  await p.click(".ppenq"); await p.waitForLoadState("load"); await p.waitForTimeout(1500);
  await p.evaluate(() => { const e = document.getElementById("enterBtn"); if (e) e.click(); }); await p.waitForTimeout(1200);
  const f = await p.evaluate(() => ({ url: location.pathname + location.search + location.hash, lang: document.documentElement.lang, vis: !document.getElementById("csel").hidden, txt: document.getElementById("cselTxt").textContent }));
  ok(f.vis && f.txt.includes(ref) && (!name || f.txt.includes(name)) && f.lang === lang && !/piece=/.test(f.url), `${lang}: form holds "${f.txt}" (${f.url}, page in ${f.lang})`);
  ok(!errs.length, `${lang}: no errors ${errs.join("|")}`);
  await c.close();
}
console.log(`${pass} pass, ${fail} fail`); await b.close();
