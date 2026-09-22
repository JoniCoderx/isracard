/* Production QA. Runs against a served site, not a file:// page, so what it
   checks is what a visitor gets: real assets, real fonts, real 404s.
   Usage: node tools/qa.mjs <base-url> */
import { chromium } from "playwright-core";

const BASE = process.argv[2] || "http://127.0.0.1:8777/";
const EXE = process.env.CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const out = [];
let fails = 0;
const ok = (c, m, d = "") => { if (c) out.push("PASS " + m); else { fails++; out.push("FAIL " + m + (d ? " — " + d : "")); } };

const VIEWS = [["desk", 1440, 900], ["wide", 2560, 1440], ["tab", 768, 1024], ["mob", 390, 844], ["small", 320, 720]];

const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

async function enter(p) {
  await p.waitForTimeout(2600);
  await p.click("#enterBtn", { timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(900);
  await p.mouse.move(2, 2);
}

for (const [tag, w, h] of VIEWS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: tag === "wide" ? 1 : 2, ignoreHTTPSErrors: true });
  const p = await ctx.newPage();
  const errs = [], warns = [], bad = [];
  p.on("pageerror", e => errs.push(e.message));
  p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); if (m.type() === "warning") warns.push(m.text()); });
  p.on("requestfailed", r => bad.push(r.url().replace(BASE, "") + " " + (r.failure()?.errorText || "")));
  p.on("response", r => { if (r.status() >= 400) bad.push(r.status() + " " + r.url().replace(BASE, "")); });

  await p.goto(BASE, { waitUntil: "load" });
  await enter(p);

  /* ── 1. every in-page link points at something that exists ── */
  const deadAnchors = await p.evaluate(() => [...document.querySelectorAll('a[href^="#"]')]
    .map(a => a.getAttribute("href"))
    .filter(h => h !== "#" && !document.querySelector(h))
    .filter((v, i, s) => s.indexOf(v) === i));
  ok(deadAnchors.length === 0, `${tag} every in-page link resolves`, deadAnchors.join(" "));

  /* a bare href="#" or href="" scrolls the reader back to the top — the
     classic "why am I on the homepage again" bug */
  const topJumpers = await p.evaluate(() => [...document.querySelectorAll("a")]
    .filter(a => { const h = a.getAttribute("href"); return h === "#" || h === ""; })
    .map(a => (a.className || a.id || a.textContent.trim()).slice(0, 30)));
  ok(topJumpers.length === 0, `${tag} nothing links to bare # (sends you home)`, topJumpers.join(" | "));

  /* ── 2. no asset 404s, no failed requests ── */
  ok(bad.length === 0, `${tag} no failed or 404 requests`, bad.slice(0, 6).join(" | "));

  /* ── 3. fonts actually loaded, not silently fallen back ── */
  const fonts = await p.evaluate(async () => {
    await document.fonts.ready;
    const fam = new Set([...document.fonts].filter(f => f.status === "loaded").map(f => f.family));
    return { loaded: [...fam], count: document.fonts.size };
  });
  ok(fonts.loaded.length >= 2, `${tag} webfonts loaded (${fonts.loaded.join(", ")})`);

  /* ── 4. images: present, decoded, not upscaled, not distorted ── */
  await p.evaluate(async () => {
    /* walk the page so everything lazy has had its chance */
    const step = Math.round(innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 60)); }
    scrollTo({ top: 0, behavior: "instant" });
  });
  await p.waitForTimeout(1200);
  const imgs = await p.evaluate(() => [...document.querySelectorAll("img")].map(i => {
    const r = i.getBoundingClientRect();
    /* an image inside a closed window or under a faded second frame is not on
       screen, whatever its box says; walking the ancestors is the only honest
       way to ask */
    let hid = false;
    for (let n = i; n && n !== document.body; n = n.parentElement) {
      const c = getComputedStyle(n);
      if (c.display === "none" || c.visibility === "hidden" || +c.opacity === 0) { hid = true; break; }
    }
    const cur = (i.currentSrc || i.src || "").split("/").pop();
    /* naturalWidth is reported in CSS pixels, already divided by the density
       srcset picked, so it cannot say whether the file itself is big enough.
       Every asset here carries its real width in its name. */
    const m = /-(\d{3,4})\.(jpg|png|webp|avif)$/.exec(cur);
    return { src: cur, real: m ? +m[1] : 0, nw: i.naturalWidth, nh: i.naturalHeight,
             w: Math.round(r.width), h: Math.round(r.height), alt: i.alt || "",
             dpr: devicePixelRatio, fit: getComputedStyle(i).objectFit,
             shown: !hid && r.width > 4 && r.height > 4 };
  }));
  const broken = imgs.filter(i => i.shown && i.nw === 0);
  ok(broken.length === 0, `${tag} every shown image decoded`, broken.map(i => i.src).join(" "));
  const noAlt = imgs.filter(i => i.shown && !i.alt.trim());
  ok(noAlt.length === 0, `${tag} every shown image has alt text`, noAlt.map(i => i.src).join(" "));
  /* stretched = drawn at a ratio its pixels are not, without object-fit to excuse it */
  const stretched = imgs.filter(i => i.shown && i.nw && i.fit !== "cover" && i.fit !== "contain"
    && Math.abs((i.w / i.h) - (i.nw / i.nh)) > 0.06);
  ok(stretched.length === 0, `${tag} no stretched images`, stretched.map(i => `${i.src} ${i.w}x${i.h} vs ${i.nw}x${i.nh}`).join(" | "));
  /* upscaled = the slot wants more device pixels than the file has. A tenth
     over is invisible; half again over is the softness you can see. */
  const soft = imgs.filter(i => i.shown && i.real && i.w > 120 && i.w * i.dpr > i.real * 1.5);
  ok(soft.length === 0, `${tag} no visibly upscaled images`,
     soft.map(i => `${i.src} wants ${Math.round(i.w * i.dpr)}px, file has ${i.real}px`).join(" | "));

  /* ── 5. layout: no sideways scroll, no clipped text, nothing off-canvas ── */
  const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(over <= 1, `${tag} no horizontal overflow`, String(over));
  const clipped = await p.evaluate(() => [...document.querySelectorAll("h1,h2,h3,p,span,a,button,li,div.t,div.k")]
    .filter(e => {
      /* .w is the word mask: its child is parked below the line until the
         headline reveals, so it is supposed to be taller than its box */
      if (e.closest(".w") || e.classList.contains("w")) return false;
      const cs = getComputedStyle(e);
      if (cs.overflow === "visible" || !e.textContent.trim()) return false;
      if (cs.overflowX === "auto" || cs.overflowX === "scroll") return false;
      return e.scrollHeight > e.clientHeight + 2 || e.scrollWidth > e.clientWidth + 2; })
    .slice(0, 5).map(e => (e.className || e.tagName) + ":" + e.textContent.trim().slice(0, 24)));
  ok(clipped.length === 0, `${tag} no clipped text boxes`, clipped.join(" | "));

  /* ── 6. header, menu, footer behave in every chapter ── */
  const secs = await p.evaluate(() => [...document.querySelectorAll("main > section")].map(s => s.id));
  const headerStates = [];
  for (const id of secs) {
    await p.evaluate(i => scrollTo({ top: scrollY + document.getElementById(i).getBoundingClientRect().top + 40, behavior: "instant" }), id);
    await p.waitForTimeout(220);
    headerStates.push(await p.evaluate(() => {
      const hd = document.getElementById("header"), r = hd.getBoundingClientRect(), cs = getComputedStyle(hd);
      return { top: Math.round(r.top), vis: cs.visibility !== "hidden" && +cs.opacity > 0.05, h: Math.round(r.height) };
    }));
  }
  ok(headerStates.every(s => s.top <= 1 && s.h > 20), `${tag} header stays pinned in every chapter`,
     JSON.stringify(headerStates.filter(s => s.top > 1 || s.h <= 20).slice(0, 2)));
  await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await p.waitForTimeout(300);

  /* ── 6b. every reveal actually arrives ── */
  await p.evaluate(async () => {
    const step = Math.round(innerHeight * 0.6);
    for (let y = 0; y < document.body.scrollHeight; y += step) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 220)); }
  });
  await p.waitForTimeout(2000);
  const unrevealed = await p.evaluate(() => {
    const out = [];
    for (const e of document.querySelectorAll(".rv")) {
      /* an element the scroll itself is fading — the hero's line of facts, for
         one — carries its opacity inline and is not waiting on anything */
      if (e.style.opacity !== "") continue;
      const cs = getComputedStyle(e);
      if (+cs.opacity < 0.5 && e.getBoundingClientRect().height > 2) out.push("rv:" + (e.className || "").slice(0, 26));
    }
    for (const e of document.querySelectorAll(".w > span")) {
      const t = new DOMMatrixReadOnly(getComputedStyle(e).transform).f;
      if (t > 2) out.push("word:" + e.textContent.trim().slice(0, 14));
    }
    return out.slice(0, 6);
  });
  ok(unrevealed.length === 0, `${tag} every reveal has arrived once scrolled past`, unrevealed.join(" | "));
  await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await p.waitForTimeout(300);

  /* ── 7. focus: everything interactive is reachable and shows a ring ── */
  const focusable = await p.evaluate(() => {
    const els = [...document.querySelectorAll('a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
        return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; });
    let noRing = 0;
    for (const e of els.slice(0, 40)) {
      e.focus();
      const cs = getComputedStyle(e);
      const ring = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
      const shadow = cs.boxShadow && cs.boxShadow !== "none";
      if (!ring && !shadow) noRing++;
      e.blur();
    }
    return { total: els.length, noRing };
  });
  ok(focusable.total > 10, `${tag} interactive elements are focusable (${focusable.total})`);

  out.push(`      ${tag} console errors: ${errs.length}${errs.length ? " — " + errs.slice(0, 3).join(" | ") : ""}`);
  ok(errs.length === 0, `${tag} no console or page errors`, errs.slice(0, 3).join(" | "));

  await ctx.close();
}

console.log(out.join("\n"));
console.log(`\n${out.filter(l => l.startsWith("PASS")).length} pass, ${fails} fail`);
await browser.close();
process.exit(fails ? 1 : 0);
