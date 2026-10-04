// This round's checks: focus trap incl. summary (both ways), dialog names, Hebrew gallery labels,
// box frame window (scroll down/up/down), reduced-motion still, idle frame loop, field errors,
// builder -> enquiry type, language in the address, product pages.
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const U = "http://localhost:8777"; let pass = 0, fail = 0;
const ok = (c, m, x) => { if (c) pass++; else { fail++; console.log("FAIL", m, x !== undefined ? JSON.stringify(x) : ""); } };
async function open(path, o = {}) {
  const c = await b.newContext({ viewport: o.vp || { width: 1366, height: 900 }, isMobile: !!o.mob, hasTouch: !!o.mob, reducedMotion: o.reduce ? "reduce" : "no-preference" });
  if (o.init) await c.addInitScript(o.init);
  const p = await c.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.route(/mailto:/, r => r.abort());
  await p.goto(U + path, { waitUntil: "load" }); await p.waitForTimeout(800);
  await p.click("#enterBtn", { timeout: 800 }).catch(() => {}); await p.waitForTimeout(600);
  return { c, p, errs };
}
// 1. focus trap with the summaries, both directions, en and he
for (const path of ["/", "/he/"]) {
  const { c, p, errs } = await open(path);
  await p.evaluate(() => { const q = document.querySelector(".pgrid .piece"); q.scrollIntoView(); q.click(); }); await p.waitForTimeout(900);
  ok(await p.evaluate(() => document.getElementById("pmodal").classList.contains("open")), path + " piece window opens");
  ok(await p.evaluate(() => { const m = document.getElementById("pmodal"), id = m.getAttribute("aria-labelledby"); return !!(id && document.getElementById(id) && document.getElementById(id).textContent.trim()); }), path + " piece window is named by its title");
  await p.focus("#pmRes"); const fwd = [];
  for (let i = 0; i < 4; i++) { await p.keyboard.press("Tab"); fwd.push(await p.evaluate(() => { const a = document.activeElement; return a.tagName + "|" + (a.id || a.textContent.trim().slice(0, 30)); })); }
  ok(fwd.some(x => /SUMMARY/.test(x)), path + " Tab from Reserve reaches the summaries", fwd);
  const all = await p.evaluate(() => [...document.querySelectorAll("#pmodal summary")].filter(s => s.offsetParent !== null).map(s => s.textContent.trim()));
  // walk forward through everything until wrapping, collecting summaries
  await p.focus("#pmRes"); const seen = new Set();
  for (let i = 0; i < 30; i++) { await p.keyboard.press("Tab"); const t = await p.evaluate(() => document.activeElement.tagName === "SUMMARY" ? document.activeElement.textContent.trim() : (document.getElementById("pmodal").contains(document.activeElement) ? "in" : "OUT")); if (t === "OUT") { seen.add("OUT"); break; } if (t !== "in") seen.add(t); }
  ok(!seen.has("OUT") && all.every(s => seen.has(s)), path + " forward Tab visits every summary and stays inside", [...seen]);
  await p.focus("#pmRes"); const back = new Set();
  for (let i = 0; i < 30; i++) { await p.keyboard.press("Shift+Tab"); const t = await p.evaluate(() => document.activeElement.tagName === "SUMMARY" ? document.activeElement.textContent.trim() : (document.getElementById("pmodal").contains(document.activeElement) ? "in" : "OUT")); if (t === "OUT") { back.add("OUT"); break; } if (t !== "in") back.add(t); }
  ok(!back.has("OUT") && all.every(s => back.has(s)), path + " Shift+Tab visits every summary and stays inside", [...back]);
  const labels = await p.evaluate(() => ({ prev: document.getElementById("pmPrev").getAttribute("aria-label"), th: [...document.querySelectorAll("#pmThumbs button")].map(x => x.getAttribute("aria-label")) }));
  if (path === "/he/") ok(labels.prev === "התמונה הקודמת" && labels.th.length && labels.th.every((t, i) => t === "תמונה " + (i + 1)), "he gallery labels in Hebrew", labels);
  else ok(labels.prev === "Previous photograph" && labels.th[0] === "Photograph 1", "en gallery labels", labels);
  ok(await p.evaluate(() => { const v = document.querySelector(".pgrid .piece a.vw"); return !!v && /pieces\/\w+\/$/.test(v.getAttribute("href")) && document.getElementById("pmPage").getAttribute("href") === v.getAttribute("href"); }), path + " quick view links to the piece page");
  ok(await p.evaluate(() => ["tryon", "menu"].every(id => { const d = document.getElementById(id); return d.getAttribute("role") === "dialog" && !!d.getAttribute("aria-label"); })), path + " try-on and menu dialogs are named");
  ok(!errs.length, path + " no page errors", errs); await c.close();
}
// 2. the box: frames held stay within the window, down, up, down again; released once far away
for (const mob of [false, true]) {
  const { c, p, errs } = await open("/", { mob, vp: mob ? { width: 390, height: 844 } : { width: 1366, height: 900 } });
  const top = await p.evaluate(() => { const r = document.getElementById("stonepin").getBoundingClientRect(); return { y: r.top + scrollY, h: r.height }; });
  let peak = 0, frames = [];
  const visit = async ts => { for (const t of ts) { await p.evaluate(([y]) => scrollTo(0, y), [top.y + (top.h - 844) * t]); await p.waitForTimeout(260); const s = await p.evaluate(() => ({ held: __box.held, frame: __box.frame, win: __box.win, step: __box.step })); peak = Math.max(peak, s.held); frames.push(s.frame); } };
  const down = [...Array(11)].map((_, i) => i / 10); await visit(down); await visit([...down].reverse()); await visit(down);
  const win = await p.evaluate(() => __box.win);
  ok(peak <= 2 * win + 2, (mob ? "390" : "1366") + " box holds at most its window of frames", { peak, win });
  ok(frames.filter(f => f >= 0).length > 25 && new Set(frames).size > 8, (mob ? "390" : "1366") + " box draws frames going down, up and down", frames);
  await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(800); await p.evaluate(() => scrollBy(0, -2)); await p.waitForTimeout(500);
  ok(await p.evaluate(() => __box.held === 0 && !__box.ok), (mob ? "390" : "1366") + " box lets go of its frames when far away", await p.evaluate(() => ({ held: __box.held, ok: __box.ok })));
  ok(!errs.length, "box no page errors", errs); await c.close();
}
{ // reduced motion: one still frame, it does not follow the scroll
  const { c, p } = await open("/", { reduce: true });
  const top = await p.evaluate(() => { const r = document.getElementById("stonepin").getBoundingClientRect(); return { y: r.top + scrollY, h: r.height }; });
  const fr = []; for (const t of [0, 0.3, 0.7, 1]) { await p.evaluate(([y]) => scrollTo(0, y), [top.y + (top.h - 900) * t]); await p.waitForTimeout(500); fr.push(await p.evaluate(() => [__box.frame, __box.held])); }
  ok(fr.every(x => x[0] === fr[0][0] && x[0] >= 0) && fr.every(x => x[1] <= 1), "reduced motion: the box shows one still frame", fr);
  await c.close();
}
{ // weak device: every third frame
  const { c, p } = await open("/", { init: () => { Object.defineProperty(navigator, "deviceMemory", { get: () => 1 }); } });
  ok(await p.evaluate(() => __box.step === 3), "a device with 1GB uses every third frame"); await c.close();
}
{ // idle: the frame loop stops when nothing moves
  const { c, p } = await open("/");
  await p.evaluate(() => scrollTo(0, 3000)); await p.waitForTimeout(2500);
  const n = await p.evaluate(() => new Promise(res => { let k = 0; const o = window.requestAnimationFrame; window.requestAnimationFrame = f => { k++; return o.call(window, f); }; setTimeout(() => { window.requestAnimationFrame = o; res(k); }, 2000); }));
  ok(n < 40, "idle page asks for few animation frames in 2s", n);
  const hv = await p.evaluate(() => { const v = document.getElementById("herovid"); return { paused: v.paused, src: !!v.src }; });
  ok(!hv.src || hv.paused, "the opening film is paused when scrolled away", hv); await c.close();
}
// 3. the form: errors in words, honest button, builder sets the type
for (const path of ["/", "/he/"]) {
  const { c, p } = await open(path);
  await p.evaluate(() => document.getElementById("concierge").scrollIntoView()); await p.waitForTimeout(400);
  const lbl = await p.evaluate(() => document.getElementById("csend").textContent.trim());
  ok(lbl === (path === "/" ? "Continue in email" : "המשך באימייל"), path + " button says it continues in email", lbl);
  await p.click("#csend"); await p.waitForTimeout(300);
  const e1 = await p.evaluate(() => ["fName", "fContact"].map(id => { const el = document.getElementById(id), m = document.getElementById(id + "Err"); return [el.getAttribute("aria-invalid"), m && !m.hidden ? m.textContent : "", el.getAttribute("aria-describedby")]; }));
  ok(e1.every(x => x[0] === "true" && x[1] && x[2]), path + " both required fields say what is missing", e1);
  ok(await p.evaluate(() => document.activeElement.id === "fName"), path + " focus goes to the first wrong field");
  await p.fill("#fName", "Test"); await p.fill("#fContact", "abc"); await p.click("#csend"); await p.waitForTimeout(300);
  const e2 = await p.evaluate(() => [document.getElementById("fNameErr").hidden, document.getElementById("fContactErr").textContent]);
  ok(e2[0] && /phone|טלפון/.test(e2[1]), path + " a wrong contact is explained", e2);
  // a collection reservation first, then a builder design: the type follows the latest
  await p.evaluate(() => { document.querySelector(".pgrid .piece .q").click(); }); await p.waitForTimeout(400);
  const w1 = await p.evaluate(() => (document.querySelector(".want .chip.on") || {}).getAttribute?.call(document.querySelector(".want .chip.on"), "data-en"));
  await p.evaluate(() => document.getElementById("reserve").click()); await p.waitForTimeout(400);
  const w2 = await p.evaluate(() => document.querySelector(".want .chip.on").getAttribute("data-en"));
  const sel = await p.evaluate(() => document.getElementById("cselAct").textContent);
  ok(w1 && w1 !== "Bespoke commission" && w2 === "Bespoke commission", path + " builder replaces the collection type", { w1, w2, sel });
  ok(await p.evaluate(() => /Price on request|מחיר לפי פנייה/.test(document.getElementById("est").textContent) && document.querySelector(".tot").classList.contains("onreq")), path + " no number while the price list is unapproved");
  await c.close();
}
// 4. language in the address
{
  const { c, p } = await open("/");
  await p.evaluate(() => document.getElementById("langBtn").click()); await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('#langmenu [data-lang="fr"]').click()); await p.waitForTimeout(1500);
  ok(/[?&]lang=fr/.test(p.url()), "picking French puts ?lang=fr in the address", p.url());
  const p2 = await c.newPage(); await p2.goto(p.url(), { waitUntil: "load" }); await p2.waitForTimeout(1500);
  ok(await p2.evaluate(() => document.documentElement.lang === "fr"), "a copied ?lang=fr link opens in French");
  await p.evaluate(() => document.getElementById("langBtn").click()); await p.waitForTimeout(300);
  await Promise.all([p.waitForNavigation({ timeout: 8000 }).catch(() => {}), p.evaluate(() => document.querySelector('#langmenu [data-lang="he"]').click())]); await p.waitForTimeout(800);
  ok(/\/he\/$/.test(new URL(p.url()).pathname), "picking Hebrew goes to /he/", p.url());
  await c.close();
}
{ // a remembered Hebrew opens the Hebrew address
  const { c, p } = await open("/", { init: () => { try { if (!sessionStorage.getItem("x")) { localStorage.setItem("silavu-lang", "he"); sessionStorage.setItem("x", "1"); } } catch (e) {} } });
  ok(/\/he\/$/.test(new URL(p.url()).pathname), "remembered Hebrew lands on /he/", p.url()); await c.close();
}
// 5. piece pages
for (const [path, lang] of [["/pieces/knot/", "en"], ["/he/pieces/knot/", "he"], ["/pieces/ring/", "en"], ["/he/pieces/pave/", "he"]]) {
  const { c, p, errs } = await open(path);
  const r = await p.evaluate(() => ({ lang: document.documentElement.lang, title: document.title, desc: document.querySelector('meta[name=description]').content, canon: document.querySelector("link[rel=canonical]").href,
    alts: [...document.querySelectorAll("link[rel=alternate][hreflang]")].map(l => l.hreflang + " " + l.href), h1: document.querySelector("h1").textContent, ld: JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent),
    imgs: [...document.querySelectorAll(".ppgal img")].map(i => i.alt).filter(Boolean).length, over: document.documentElement.scrollWidth > innerWidth }));
  ok(r.lang === lang, path + " language", r.lang);
  ok(r.canon.endsWith(path) && r.alts.length === 3, path + " canonical and hreflang", [r.canon, r.alts]);
  ok(r.h1 && r.title && r.desc && r.imgs >= 2, path + " title, description, heading, described photographs", [r.title, r.desc.slice(0, 60), r.h1, r.imgs]);
  const prod = r.ld["@graph"].find(x => x["@type"] === "Product");
  ok(prod && !prod.offers && prod.name && prod.image.length, path + " Product schema without an invented offer", prod && Object.keys(prod));
  ok(!r.over, path + " no sideways scroll"); ok(!errs.length, path + " no page errors", errs);
  await c.close();
}
console.log(pass + " pass, " + fail + " fail"); await b.close();
