// Hebrew RTL audit: screenshots of every screen of /he/ and the Hebrew documents, plus checks for
// text set left-aligned or LTR inside Hebrew, arrows pointing the wrong way, Latin/Hebrew order
// problems (punctuation stranded at the wrong end), sideways overflow, and controls laid out LTR.
import { chromium } from "playwright-core"; import fs from "fs";
const O = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/he/"; fs.mkdirSync(O, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const pages = (process.env.PAGES || "/he/,/he/pieces/ring/,/about/?lang=he,/privacy/?lang=he").split(",");
for (const [w, h] of [[390, 844], [1366, 900]]) for (const pth of pages) {
  const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 760, hasTouch: w < 760, reducedMotion: "reduce" });
  const p = await c.newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.goto("http://localhost:8777" + pth, { waitUntil: "load" }); await p.waitForTimeout(1200); await p.click("#enterBtn", { timeout: 800 }).catch(() => {});
  await p.evaluate(async () => { document.documentElement.style.scrollBehavior = "auto"; document.querySelectorAll(".rv").forEach(e => e.classList.add("in")); await document.fonts.ready; });
  const r = await p.evaluate(() => {
    const out = { dir: document.documentElement.dir, leftAligned: [], ltrHebrew: [], arrows: [], stranded: [], over: 0 };
    const he = /[֐-׿]/;
    document.querySelectorAll("body *").forEach(e => {
      if (!e.offsetParent && getComputedStyle(e).position !== "fixed") return;
      const own = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join("").trim();
      if (!own || !he.test(own)) return;
      const cs = getComputedStyle(e), r = e.getBoundingClientRect(); if (r.width < 2) return;
      const tag = e.tagName.toLowerCase() + "." + (e.className || "").toString().split(" ")[0] + (e.closest("[id]") ? "#" + e.closest("[id]").id : "");
      if (cs.direction === "ltr") out.ltrHebrew.push(tag + ": " + own.slice(0, 30));
      if ((cs.textAlign === "left" || cs.textAlign === "start" && cs.direction === "ltr") && e.getBoundingClientRect().width > 180 && own.length > 12) out.leftAligned.push(tag + ": " + own.slice(0, 30));
      // punctuation that bidi left at the wrong end: a Hebrew line that starts with . , : or ends with an opening bracket
      const vis = e.innerText.trim(); if (/^[.,:;!?]/.test(vis)) out.stranded.push(tag + ": " + vis.slice(0, 30));
    });
    document.querySelectorAll("svg, i, .arr, [class*=chev], [class*=arrow]").forEach(e => { const t = e.getAttribute("class") || ""; if (/next|prev|chev|arrow|arr/.test(t) && e.getBoundingClientRect().width > 0) { const m = getComputedStyle(e).transform; out.arrows.push(t.slice(0, 20) + " " + (m === "none" ? "unmirrored" : m.slice(0, 22))); } });
    out.over = document.documentElement.scrollWidth - innerWidth;
    return out;
  });
  const H = await p.evaluate(() => document.documentElement.scrollHeight); let i = 0;
  for (let y = 0; y < H && i < 30; y += h) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(250); await p.screenshot({ path: `${O}${w}-${pth.replace(/[\/?=]/g, "_")}-${String(i++).padStart(2, "0")}.png` }); }
  console.log(`\n== ${w} ${pth} dir=${r.dir} overflow=${r.over} screens=${i}`);
  console.log(" LTR Hebrew:", r.ltrHebrew.length, r.ltrHebrew.slice(0, 8).join(" | "));
  console.log(" left-aligned Hebrew blocks:", r.leftAligned.length, r.leftAligned.slice(0, 8).join(" | "));
  console.log(" stranded punctuation:", r.stranded.length, r.stranded.slice(0, 8).join(" | "));
  await c.close();
}
await b.close();
