// Things on things: at every step of a full scroll, each fixed or sticky
// control (header, bars, pills, buttons) is checked against the text and
// controls of the page beneath it; anything readable or pressable that it
// covers is reported, with where.
import { chromium } from "playwright-core";
const base = process.env.BASE || "http://localhost:8777/";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [w, h, mob, path] of [[390, 844, true, ""], [390, 844, true, "he/"], [1440, 900, false, ""], [768, 1024, true, ""]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob });
  const p = await c.newPage(); await p.goto(base + path, { waitUntil: "load" }); await p.waitForTimeout(1500); await p.click("#enterBtn", { timeout: 1200 }).catch(() => {});
  const r = await p.evaluate(async () => {
    document.documentElement.style.scrollBehavior = "auto"; document.querySelectorAll(".rv").forEach(e => e.classList.add("in"));
    const vis = e => { const s = getComputedStyle(e); return s.visibility === "visible" && s.display !== "none" && +s.opacity > 0.3; };
    const floats = () => [...document.querySelectorAll("body *")].filter(e => { const s = getComputedStyle(e); return (s.position === "fixed") && vis(e) && e.getBoundingClientRect().width > 10 && e.getBoundingClientRect().height > 10 && !["dust", "glow", "grain"].includes(e.id) && !e.closest("#header") || e.id === "header"; });
    const targets = () => [...document.querySelectorAll("main h1, main h2, main h3, main p, main a, main button, main label, main input, main .chip, main .k")].filter(e => { const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4 && vis(e) && e.textContent.trim(); });
    const hits = {}; const H = document.documentElement.scrollHeight - innerHeight;
    for (let y = 0; y <= H; y += 260) {
      scrollTo(0, y); await new Promise(r => setTimeout(r, 160));
      const F = floats().map(e => [e, e.getBoundingClientRect()]);
      for (const t of targets()) { const tr = t.getBoundingClientRect(); if (tr.bottom < 0 || tr.top > innerHeight) continue;
        for (const [f, fr] of F) { if (f.contains(t) || t.contains(f)) continue;
          const ox = Math.min(tr.right, fr.right) - Math.max(tr.left, fr.left), oy = Math.min(tr.bottom, fr.bottom) - Math.max(tr.top, fr.top);
          if (ox > 6 && oy > 6 && ox * oy > 0.3 * tr.width * tr.height) {
            /* is the float really on top here? */
            const cx = Math.max(tr.left, fr.left) + ox / 2, cy = Math.max(tr.top, fr.top) + oy / 2, top = document.elementFromPoint(cx, cy);
            if (!top || !(f === top || f.contains(top))) continue;
            const k = (f.id ? "#" + f.id : f.className.toString().split(" ")[0]) + " over " + t.tagName.toLowerCase() + " \"" + t.textContent.trim().slice(0, 26) + "\" in " + ((t.closest("section") || {}).id || "-");
            hits[k] = (hits[k] || 0) + 1; } } }
    }
    return Object.entries(hits).sort((a, b) => b[1] - a[1]).slice(0, 25);
  });
  console.log(`== ${w}x${h} ${path || "en"}: ${r.length ? "" : "nothing covered"}`); r.forEach(([k, v]) => console.log(`  ${v}x ${k}`));
  await c.close();
}
await b.close();
