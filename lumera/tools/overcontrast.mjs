// Text that sits over the film or a photograph: hide the text, photograph what is behind it,
// and record the text colour; overcontrast.py then computes WCAG contrast against the
// 95th-percentile brightest background pixel (the worst case for light text).
import { chromium } from "playwright-core"; import fs from "fs";
const O = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/ct/";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const out = [];
for (const [w, h] of [[390, 844], [1366, 900]]) for (const lang of ["en", "he"]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 760, hasTouch: w < 760 });
  const p = await c.newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.goto("http://localhost:8777/" + (lang === "he" ? "he/" : ""), { waitUntil: "load" }); await p.waitForTimeout(1500);
  await p.click("#enterBtn", { timeout: 800 }).catch(() => {}); await p.waitForTimeout(3500);
  await p.evaluate(() => document.querySelectorAll(".rv").forEach(e => e.classList.add("in")));
  const sel = ["#hero h1", "#hero .p", "#hero .k", "#hcap .p", "#hcap h2", "#beats .beat.on .p", "#beats .beat.on h2", "#wtxt .p", "#wtxt h2", "#concierge .p", "#concierge .fine"];
  for (const s of sel) {
    const els = await p.$$(s); if (!els.length) continue; const el = els[0];
    await el.scrollIntoViewIfNeeded().catch(() => {}); await p.waitForTimeout(700);
    const info = await el.evaluate(e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return { r: { x: Math.max(0, r.x), y: Math.max(0, r.y), w: Math.min(innerWidth, r.right) - Math.max(0, r.x), h: Math.min(innerHeight, r.bottom) - Math.max(0, r.y) }, color: cs.color, fs: parseFloat(cs.fontSize), fw: +cs.fontWeight, op: +cs.opacity, vis: r.width > 0 && cs.visibility !== "hidden" }; });
    if (!info.vis || info.r.w < 4 || info.r.h < 4) continue;
    const st = await p.addStyleTag({ content: s + ", " + s + " * { color: transparent !important; text-shadow: none !important; -webkit-text-fill-color: transparent !important; }" });
    await p.waitForTimeout(250);
    const f = `${w}-${lang}-${s.replace(/[^a-z0-9]+/gi, "_")}.png`;
    await p.screenshot({ path: O + f, clip: { x: info.r.x, y: info.r.y, width: info.r.w, height: info.r.h } });
    await st.evaluate(n => n.remove());
    out.push({ w, lang, sel: s, file: f, color: info.color, fs: info.fs, fw: info.fw });
  }
  await c.close();
}
fs.writeFileSync(O + "items.json", JSON.stringify(out, null, 1)); console.log("items", out.length); await b.close();
