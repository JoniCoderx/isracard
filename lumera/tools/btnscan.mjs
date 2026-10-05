// Buttons over the scroll: every visible button and button-like link is
// sampled at each step of a full scroll; any whose own background turns
// near-black while the ground behind it is dark (or whose text vanishes into
// its background) is reported with where it happened.
import { chromium } from "playwright-core";
const base = process.env.BASE || "http://localhost:8777/";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [w, h, mob, path] of [[390, 844, true, ""], [390, 844, true, "he/"], [1440, 900, false, ""]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob });
  const p = await c.newPage(); await p.goto(base + path, { waitUntil: "load" }); await p.waitForTimeout(1500); await p.click("#enterBtn", { timeout: 1200 }).catch(() => {});
  const r = await p.evaluate(async () => {
    document.documentElement.style.scrollBehavior = "auto";
    const lum = c => { const m = c.match(/[\d.]+/g); if (!m) return null; const [r, g, b, a = 1] = m.map(Number); return { L: (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255, a }; };
    const name = e => (e.id ? "#" + e.id : e.tagName.toLowerCase() + "." + [...e.classList].slice(0, 2).join(".")) + " \"" + e.textContent.trim().slice(0, 18) + "\"";
    const seen = {}, issues = {};
    const H = document.documentElement.scrollHeight - innerHeight;
    for (let y = 0; y <= H; y += 220) {
      scrollTo(0, y); await new Promise(r => setTimeout(r, 120));
      for (const e of document.querySelectorAll("button, a.btn, .btn, .chip, #fab, #cbar .btn")) {
        const rc = e.getBoundingClientRect(); if (rc.width < 20 || rc.height < 16 || rc.bottom < 0 || rc.top > innerHeight) continue;
        const s = getComputedStyle(e); if (s.visibility !== "visible" || +s.opacity < 0.5) continue;
        const bg = lum(s.backgroundColor), fg = lum(s.color); if (!fg) continue;
        const k = name(e); const sec = (e.closest("section") || { id: "fixed" }).id;
        const state = bg && bg.a > 0.5 ? (bg.L < 0.12 ? "black" : bg.L > 0.8 ? "light" : "mid") : "clear";
        (seen[k] ||= new Set()).add(state + "@" + sec);
        if (bg && bg.a > 0.5 && Math.abs(bg.L - fg.L) < 0.25) (issues[k] ||= []).push(`text ${fg.L.toFixed(2)} on bg ${bg.L.toFixed(2)} at y${y} in ${sec}`);
      }
    }
    const changed = Object.entries(seen).filter(([k, v]) => { const st = new Set([...v].map(x => x.split("@")[0])); return st.size > 1; }).map(([k, v]) => k + " → " + [...v].join(", "));
    return { changed, issues: Object.entries(issues).map(([k, v]) => k + ": " + v.slice(0, 2).join(" | ")) };
  });
  console.log(`== ${w} ${path || "en"}`); console.log("states that change while scrolling:\n  " + (r.changed.join("\n  ") || "none")); console.log("low contrast:\n  " + (r.issues.join("\n  ") || "none"));
  await c.close();
}
await b.close();
