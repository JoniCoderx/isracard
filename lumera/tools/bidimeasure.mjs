import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600); await p.click("#enterBtn", { timeout: 6000 }).catch(() => {});
await p.waitForTimeout(700); await p.click("#langBtn", { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(400); await p.click('[data-lang="he"]', { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(1400);
const t = await p.evaluate(() => document.documentElement.scrollHeight);
for (let v = 0; v < t; v += 300) { await p.evaluate(x => scrollTo({top:x,behavior:"instant"}), v); await p.waitForTimeout(40); }
/* every question opened, so the chips inside have geometry to judge */
await p.evaluate(() => document.querySelectorAll("#opts .opt").forEach(o => o.classList.add("open")));
await p.waitForTimeout(400);
/* a measure reads correctly when the digits sit to the LEFT of the unit */
const r = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll('.chip[data-k="ct"], .chip[data-k="wrist"], .optnow[data-k]').forEach(e => {
    const txt = (e.textContent || "").trim(); if (!/^\d/.test(txt)) return;
    const rg = document.createRange(); const n = e.firstChild; if (!n || n.nodeType !== 3) return;
    const m = txt.match(/^(\d+(?:\.\d+)?)\s*([A-Za-z]+)$/); if (!m) return;
    rg.setStart(n, 0); rg.setEnd(n, m[1].length); const a = rg.getBoundingClientRect();
    rg.setStart(n, txt.length - m[2].length); rg.setEnd(n, txt.length); const b = rg.getBoundingClientRect();
    if (!a.width && !b.width) return;   /* folded away — no geometry to judge */
    out.push({ txt, numLeft: Math.round(a.left), unitLeft: Math.round(b.left), ok: a.left < b.left });
  });
  return out;
});
const bad = r.filter(x => !x.ok);
console.log(r.length + " measures checked, " + bad.length + " reversed");
bad.slice(0, 8).forEach(x => console.log("  REVERSED " + JSON.stringify(x)));
if (r.length) console.log("  sample " + JSON.stringify(r[0]));
await b.close();
