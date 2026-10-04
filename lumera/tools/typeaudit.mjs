// Lists running text below 15px or under weight 400, and action labels below 12px, per width and language.
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const port = process.env.PORT || 8777;
for (const [w, h] of [[390, 844], [1366, 900]]) for (const lang of ["en", "he"]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 760, hasTouch: w < 760, reducedMotion: "reduce" });
  const p = await c.newPage(); await p.goto(`http://localhost:${port}/${lang === "he" ? "he/" : ""}`, { waitUntil: "load" }); await p.waitForTimeout(900);
  await p.click("#enterBtn", { timeout: 800 }).catch(() => {});
  // open a product window so its text is measured too
  await p.evaluate(() => { const q = document.querySelector(".pgrid .piece .im, .pgrid .piece [data-piece]"); q && q.click(); }); await p.waitForTimeout(700);
  const r = await p.evaluate(() => {
    const out = {}; const act = "a.btn, button.btn, .lnk, button.chip, .cat";
    document.querySelectorAll("p, li, .p, dd, summary span, " + act).forEach(e => {
      const t = (e.innerText || "").trim(); if (!t) return; const s = getComputedStyle(e); if (s.display === "none" || s.visibility === "hidden") return;
      const fs = parseFloat(s.fontSize), fw = +s.fontWeight, isAct = e.matches(act);
      const bad = isAct ? fs < 12 : (t.length > 50 && (fs < 15 || fw < 400));
      if (!bad) return;
      const key = (isAct ? "ACT " : "TXT ") + e.tagName.toLowerCase() + (e.className && typeof e.className === "string" ? "." + e.className.trim().split(/\s+/).slice(0, 2).join(".") : "") + (e.closest("[id]") ? " in #" + e.closest("[id]").id : "") + " " + fs.toFixed(1) + "px/" + fw;
      out[key] = (out[key] || 0) + 1;
    });
    return out;
  });
  console.log("==", w, lang); Object.entries(r).sort().forEach(([k, n]) => console.log(" ", n, k));
  await c.close();
}
await b.close();
