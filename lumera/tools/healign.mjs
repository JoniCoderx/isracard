// Hebrew/Arabic paragraph alignment: in a right-to-left page every wrapped line of a
// right-to-left paragraph must start at the right edge. Finds blocks whose lines ragged
// to the left (the "last line on the wrong side" bug) on every Hebrew screen.
import { chromium } from "playwright-core";
const base = process.env.BASE || "http://localhost:8777/";
const pages = (process.env.PAGES || "he/,he/pieces/knot/,he/pieces/moment/,he/about/,he/privacy/,?lang=ar").split(",");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let bad = 0;
for (const w of [1366, 390]) for (const path of pages) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  const r = await p.goto(base + path, { waitUntil: "load" }).catch(() => null);
  if (!r || r.status() >= 400) { await p.close(); continue; }
  await p.waitForTimeout(600);
  const out = await p.evaluate(() => {
    const res = [];
    for (const e of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(e);
      if (!/^(block|list-item|table-cell)$/.test(cs.display) || cs.visibility !== "visible") continue;
      if (!/[֐-ۿ]/.test(e.textContent)) continue;
      if ([...e.children].some(c => /^(block|flex|grid|list-item|table)/.test(getComputedStyle(c).display))) continue;
      if (cs.textAlign === "center" || cs.textAlign === "justify") continue;
      const rg = document.createRange(); rg.selectNodeContents(e);
      // one line = rects whose vertical middles fall inside each other (words in a
      // larger or italic face sit a little higher or lower but on the same line)
      const ls = [];
      for (const q of rg.getClientRects()) { if (q.width < 1) continue; const m = (q.top + q.bottom) / 2;
        const l = ls.find(l => m > l[2] && m < l[3]); if (l) { l[0] = Math.min(l[0], q.left); l[1] = Math.max(l[1], q.right); } else ls.push([q.left, q.right, q.top, q.bottom]); }
      if (ls.length < 2) continue;
      const rmax = Math.max(...ls.map(l => l[1]));
      const off = ls.filter(l => rmax - l[1] > 12);
      if (off.length) res.push({ sel: e.tagName.toLowerCase() + "." + [...e.classList].join("."), dir: cs.direction, ub: cs.unicodeBidi, ta: cs.textAlign, lines: ls.length, text: e.textContent.trim().slice(0, 50) });
    }
    return res;
  });
  for (const o of out) { bad++; console.log(w, path, JSON.stringify(o)); }
  await p.close();
}
console.log(bad ? `FAIL ${bad} blocks with lines on the wrong side` : "OK: every wrapped right-to-left paragraph starts on the right");
await b.close(); process.exit(bad ? 1 : 0);
