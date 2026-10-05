// The header keeps one physical layout in every language: the logo, the
// navigation, the language choice and the appointment stay where they are
// when the page turns right-to-left. Home, a piece, About and a document,
// on a desktop and a phone.
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const U = process.env.U || "http://localhost:8777/";
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
const SEL = { home: { logo: "header .mark", nav: "header nav, header .nav", lang: "#langBtn, header .lang, header [id^=langBtn]", cta: "header .cta, header a[href*='concierge'], header .btn", menu: "#menuBtn, header .menub" },
              doc: { logo: ".dhd .dhome", nav: ".dhd .dnav", lang: ".dhd .dlang", cta: ".dhd .dbook" } };
const pages = [["home", "", "he/", "?lang=ar"], ["doc", "pieces/ring/", "he/pieces/ring/", "pieces/ring/?lang=ar"], ["doc", "about/", "about/?lang=he", "about/?lang=ar"], ["doc", "care/", "care/?lang=he", "care/?lang=ar"]];
for (const [w, h, mob] of [[1440, 900, false], [390, 844, true]]) for (const [kind, en, he, ar] of pages) {
  const pos = {};
  for (const [l, path] of [["en", en], ["he", he], ["ar", ar]]) {
    const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob }); const p = await c.newPage();
    await p.goto(U + path, { waitUntil: "load" }); await p.waitForTimeout(900); await p.evaluate(() => { const e = document.getElementById("enterBtn"); if (e) e.click(); }); await p.waitForTimeout(900);
    pos[l] = await p.evaluate(S => { const o = { dir: document.documentElement.dir || "ltr" }; for (const [k, sel] of Object.entries(S)) { const e = [...document.querySelectorAll(sel)].find(x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top < 200; }); if (!e) { o[k] = null; continue; } const r = e.getBoundingClientRect(); o[k] = { c: Math.round(r.left + r.width / 2), l: Math.round(r.left), r: Math.round(r.right) }; } return o; }, SEL[kind]);
    await c.close();
  }
  const keys = Object.keys(SEL[kind]).filter(k => pos.en[k] != null);
  /* each item is held by the edge it is anchored to: the logo by its centre,
     what sits on the left by its left edge, what sits on the right by its
     right edge; the words inside may be longer or shorter */
  const edge = (k, o) => { const half = w / 2; return k === "logo" ? o.c : (pos.en[k].c < half ? o.l : o.r); };
  const moved = keys.filter(k => ["he", "ar"].some(l => pos[l][k] == null || Math.abs(edge(k, pos[l][k]) - edge(k, pos.en[k])) > 14 || (pos[l][k].c < w / 2) !== (pos.en[k].c < w / 2)));
  ok(!moved.length && pos.he.dir === "rtl" && pos.ar.dir === "rtl", `${w} ${en || "home"}: ${keys.map(k => k + " " + [pos.en, pos.he, pos.ar].map(o => edge(k, o[k] || { c: -1, l: -1, r: -1 })).join("/")).join(", ")}${moved.length ? "  MOVED: " + moved.join(",") : ""}`);
}
console.log(`${pass} pass, ${fail} fail`); await b.close();
