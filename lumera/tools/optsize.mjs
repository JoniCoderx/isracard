/* What the builder actually costs a thumb: every control in #opts, measured. */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil: "load" });
await p.waitForTimeout(2600); await p.click("#enterBtn").catch(() => {});
await p.waitForTimeout(800);
await p.evaluate(async () => { const s = Math.round(innerHeight * 0.8); for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 80)); } });
await p.evaluate(() => document.getElementById("stripwrap").scrollIntoView({ block: "center", behavior: "instant" }));
await p.waitForTimeout(1500);
const rep = await p.evaluate(() => {
  const o = document.getElementById("opts"); if (!o) return "no #opts";
  const r = o.getBoundingClientRect();
  const rows = [];
  for (const g of o.querySelectorAll(".opt, .row, fieldset, .grp")) {
    const gr = g.getBoundingClientRect();
    if (gr.height < 4) continue;
    rows.push({ cls: String(g.className).slice(0, 26), h: Math.round(gr.height) });
  }
  const ctl = [];
  for (const e of o.querySelectorAll("button, [role=button], input, label.sw, .chip, .cat, .sk")) {
    const q = e.getBoundingClientRect(); if (q.height < 2) continue;
    const cs = getComputedStyle(e);
    ctl.push({ t: (e.textContent || e.getAttribute("aria-label") || e.tagName).trim().slice(0, 14), w: Math.round(q.width), h: Math.round(q.height), cls: String(e.className).slice(0, 22), fs: cs.fontSize, pad: cs.padding });
  }
  return { optsH: Math.round(r.height), optsW: Math.round(r.width), vh: innerHeight, rows, n: ctl.length, ctl };
});
console.log(JSON.stringify(rep, null, 1));
await b.close();
