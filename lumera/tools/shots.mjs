import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "shots");
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE || "http://localhost:3000";

const exe = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch({
  executablePath: exe,
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
const errs = [];
page.on("pageerror", (e) => errs.push("PAGEERR " + e.message));
page.on("console", (m) => { if (m.type() === "error") errs.push("CONSOLE " + m.text().slice(0, 160)); });

const shot = (name) => page.screenshot({ path: path.join(OUT, name + ".png") });
const wait = (ms) => page.waitForTimeout(ms);

async function scrollTo(frac) {
  await page.evaluate((f) => {
    const h = document.body.scrollHeight - window.innerHeight;
    const l = window.__lenis;
    if (l) l.scrollTo(h * f, { immediate: true });
    else window.scrollTo(0, h * f);
  }, frac);
}

const targets = process.argv.slice(2);
const want = (t) => targets.length === 0 || targets.includes(t);

if (want("home")) {
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await wait(2200);
  await shot("01-home-intro");
  // click Enter
  const btn = page.getByText(/Enter SILAVU/i).first();
  if (await btn.count()) await btn.click().catch(() => {});
  await wait(1600);
  await shot("02-home-entered");
  for (const [f, n] of [[0.12, "03-home-approach"], [0.4, "04-home-orbit"], [0.62, "05-home-dive"], [0.9, "06-home-line"]]) {
    await scrollTo(f);
    await wait(1400);
    await shot(n);
  }
  // deeper editorial sections
  await scrollTo(0.98);
  await wait(1000);
  await shot("07-home-final");
}

if (want("line")) {
  await page.goto(BASE + "/the-line", { waitUntil: "domcontentloaded" });
  await wait(4000);
  await shot("10-line-hero");
  await scrollTo(0.5);
  await wait(2500);
  await shot("11-line-builder");
}

if (want("private")) {
  await page.goto(BASE + "/private", { waitUntil: "domcontentloaded" });
  await wait(1500);
  await shot("20-private-intro");
  await scrollTo(0.35);
  await wait(1200);
  await shot("21-private-journey");
  await scrollTo(0.9);
  await wait(1200);
  await shot("22-private-request");
}

if (want("room")) {
  await page.goto(BASE + "/private-room", { waitUntil: "domcontentloaded" });
  await wait(1400);
  await shot("30-room");
  const svc = page.getByText("Private Viewing").first();
  if (await svc.count()) await svc.click().catch(() => {});
  await wait(900);
  await shot("31-room-service");
}

if (want("misc")) {
  await page.goto(BASE + "/the-stone", { waitUntil: "domcontentloaded" });
  await wait(1400);
  await shot("40-stone");
  await scrollTo(0.4);
  await wait(1200);
  await shot("41-stone-mid");

  await page.goto(BASE + "/showcase", { waitUntil: "domcontentloaded" });
  await wait(1400);
  await shot("50-showcase");

  await page.goto(BASE + "/showcase/the-eternal-tennis", { waitUntil: "domcontentloaded" });
  await wait(1400);
  await shot("51-product");

  await page.goto(BASE + "/house", { waitUntil: "domcontentloaded" });
  await wait(1200);
  await shot("60-house");
}

console.log("ERRORS:", errs.length ? [...new Set(errs)].slice(0, 8) : "none");
await browser.close();
