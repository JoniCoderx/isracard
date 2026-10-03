// axe-core (WCAG 2.1 A/AA rules) over the home page and two house pages, en + he, phone + desktop.
import { chromium } from "playwright-core";
import { readFileSync } from "fs";
import { createRequire } from "module";
const axe = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const BASE = process.env.BASE || "http://localhost:8777/";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
let bad = 0;
for (const [w, h, mob] of [[390, 844, true], [1366, 900, false]]) for (const path of ["", "he/", "about/", "privacy/"]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, reducedMotion: "reduce" });
  const p = await c.newPage(); await p.goto(BASE + path, { waitUntil: "load" }); await p.waitForTimeout(1200);
  await p.addScriptTag({ content: axe });
  const r = await p.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } })).violations.map(v => `${v.impact} ${v.id} (${v.nodes.length}): ${v.nodes.slice(0, 3).map(n => n.target.join(" ")).join(" | ")}`));
  console.log(`${w} /${path}: ${r.length ? "\n  " + r.join("\n  ") : "clean"}`); bad += r.length; await c.close();
}
console.log(bad ? `${bad} violation groups` : "axe: 0 violations"); await b.close();
