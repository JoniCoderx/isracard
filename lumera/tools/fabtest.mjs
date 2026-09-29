/* The floating button never rests on a word. At every scroll position where it
   is showing, its box is checked against the line boxes under it. */
import { chromium } from "playwright-core";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [W, H, lang] of [[390, 844, "en"], [320, 780, "en"], [390, 844, "he"]]) {
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0, 120)));
  await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2400); await p.click("#enterBtn", { timeout: 6000 }).catch(() => {});
  await p.waitForTimeout(600);
  if (lang === "he") { await p.click("#langBtn", { timeout: 4000 }).catch(() => {});
    await p.waitForTimeout(350); await p.click('[data-lang="he"]', { timeout: 4000 }).catch(() => {}); await p.waitForTimeout(1200); }
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  const hits = []; let shown = 0, stops = 0;
  for (let y = 700; y + H < total; y += 160) {
    await p.evaluate(v => scrollTo({ top: v, behavior: "instant" }), y);
    stops++;
    await p.waitForTimeout(1600);          /* the button waits for the scroll to rest, and looks again while the chapter finishes arriving */
    const h = await p.evaluate(() => {
      const f = document.getElementById("fab");
      if (!f.classList.contains("show")) return { shown: false, worst: null };
      const r = f.getBoundingClientRect(), rg = document.createRange();
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n, worst = null;
      while ((n = w.nextNode())) {
        if (!n.nodeValue.trim()) continue;
        if (f.contains(n.parentElement)) continue;
        const pe = n.parentElement; if (!pe || !pe.offsetParent && getComputedStyle(pe).position !== "fixed") continue;
        /* a crossfading caption still has line boxes while it is invisible, and
           a clipped one still has them outside its scroller; neither is a word
           on the screen, so the whole chain is asked, not just the parent */
        let hidden = false, clip = null;
        for (let a = pe; a && a !== document.documentElement; a = a.parentElement) {
          const s = getComputedStyle(a);
          if (s.visibility === "hidden" || s.display === "none" || parseFloat(s.opacity) < 0.06) { hidden = true; break; }
          if (s.overflow !== "visible" || s.overflowY !== "visible" || s.overflowX !== "visible") {
            const ab = a.getBoundingClientRect();
            clip = clip ? { left: Math.max(clip.left, ab.left), top: Math.max(clip.top, ab.top),
                            right: Math.min(clip.right, ab.right), bottom: Math.min(clip.bottom, ab.bottom) }
                        : { left: ab.left, top: ab.top, right: ab.right, bottom: ab.bottom };
          }
        }
        if (hidden) continue;
        rg.selectNodeContents(n);
        for (const b of rg.getClientRects()) {
          if (b.width < 1 || b.height < 1) continue;
          const v = clip ? { left: Math.max(b.left, clip.left), top: Math.max(b.top, clip.top),
                             right: Math.min(b.right, clip.right), bottom: Math.min(b.bottom, clip.bottom) } : b;
          if (v.right - v.left < 1 || v.bottom - v.top < 1) continue;
          const ox = Math.min(r.right, v.right) - Math.max(r.left, v.left);
          const oy = Math.min(r.bottom, v.bottom) - Math.max(r.top, v.top);
          if (!(ox > 2 && oy > 2)) continue;
          /* the text may be covered by something opaque — the builder panel
             scrolls over the carat readout — and text nobody can see is not
             text the button is sitting on. The button is lifted out of the
             hit test and the overlap is asked who is actually on top. */
          const cx = (Math.max(r.left, v.left) + Math.min(r.right, v.right)) / 2;
          const cy = (Math.max(r.top, v.top) + Math.min(r.bottom, v.bottom)) / 2;
          const keep = f.style.pointerEvents; f.style.pointerEvents = "none";
          const top = document.elementFromPoint(cx, cy);
          f.style.pointerEvents = keep;
          if (!top || !(top === pe || top.contains(pe) || pe.contains(top))) continue;
          worst = { text: n.nodeValue.trim().slice(0, 30), ox: Math.round(ox), oy: Math.round(oy) };
        }
      }
      return { shown: true, worst };
    });
    if (h.shown) shown++;
    if (h.worst) hits.push({ y, ...h.worst });
  }
  ok(shown >= stops * 0.25, `${W} ${lang} the floating button is still offered (shown at ${shown} of ${stops} resting places)`);
  ok(hits.length === 0, `${W} ${lang} the floating button never rests on a word (${hits.length} overlap${hits.length === 1 ? "" : "s"}${hits[0] ? ", first at y=" + hits[0].y + ' over "' + hits[0].text + '"' : ""})`);
  ok(errs.length === 0, `${W} ${lang} no script errors`);
  await p.close();
}
console.log(`\n${pass} pass, ${fail} fail`);
await b.close();
process.exit(fail ? 1 : 0);
