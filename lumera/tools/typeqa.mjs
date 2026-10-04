// Typography swap QA: every section's height before (8779, old fonts) and after (8777, new fonts),
// per page, width and language; plus any control whose text no longer fits its box.
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const pages = ["/", "/he/", "/about/", "/privacy/", "/pieces/knot/", "/he/pieces/ring/"];
let worst = [], clipped = new Set(), fontsBad = [];
for (const [w, h] of [[390, 844], [1366, 900], [1920, 1080]]) for (const pth of pages) {
  const res = {};
  for (const port of [8779, 8777]) {
    const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 760, hasTouch: w < 760, reducedMotion: "reduce" });
    const p = await c.newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await p.goto(`http://localhost:${port}${pth}`, { waitUntil: "load" }); await p.waitForTimeout(700); await p.click("#enterBtn", { timeout: 700 }).catch(() => {});
    await p.evaluate(async () => { document.querySelectorAll(".rv").forEach(e => e.classList.add("in")); await document.fonts.ready; });
    await p.waitForTimeout(600);
    res[port] = await p.evaluate(() => {
      const secs = [...document.querySelectorAll("body section[id], body header, body footer, main.doc, .dpage > header, .dpage > footer")];
      const hs = Object.fromEntries(secs.map(s => [s.tagName.toLowerCase() + (s.id ? "#" + s.id : "." + (s.className || "").toString().split(" ")[0]), Math.round(s.getBoundingClientRect().height)]));
      const clip = [...document.querySelectorAll(".btn, .chip, .lnk, .cat, .k, button, .lang, .dbook, summary")].filter(e => e.offsetParent && e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== "visible").map(e => (e.id || e.className.toString().split(" ")[0]) + ":" + e.textContent.trim().slice(0, 24));
      const fams = new Set(); document.querySelectorAll("h1, h2, .h, .h2, p, .btn, .k").forEach(e => fams.add(getComputedStyle(e).fontFamily.split(",")[0].replace(/"/g, "")));
      return { hs, clip, fams: [...fams], loaded: [...document.fonts].filter(f => f.status === "loaded").map(f => f.family.replace(/"/g, "") + " " + f.style).filter((v, i, a) => a.indexOf(v) === i), total: document.documentElement.scrollHeight };
    });
    await c.close();
  }
  const A = res[8779], B = res[8777], diffs = [];
  for (const k in B.hs) if (A.hs[k] != null && Math.abs(B.hs[k] - A.hs[k]) > 0) diffs.push(k + " " + A.hs[k] + "→" + B.hs[k]);
  console.log(`${w} ${pth} page ${A.total}→${B.total} (${B.total - A.total >= 0 ? "+" : ""}${B.total - A.total}px)`, diffs.length ? "| " + diffs.slice(0, 8).join(", ") : "| every section the same height");
  B.clip.forEach(x => clipped.add(w + " " + pth + " " + x));
  if (w === 1366) console.log("   fonts in use:", B.fams.join(" / "), "| loaded:", B.loaded.join(", "));
}
console.log("controls whose text overflows:", clipped.size ? [...clipped].join(" | ") : "none");
await b.close();
