// SOUL as the whole experience (/test5/), rendered once: the necklace of
// src/t4/soul5-scene.js (three.js), frame by frame, on a clear ground (the
// page's own studio shows through), so the page can set the type behind the
// piece. The first ten frames are drawn slightly soft, coming into focus as
// the camera draws back from the metal.
//   public/f/soul5/d-NNN.webp (wide screens, 1920x1080)
//   public/f/soul5/m-NNN.webp (phones, 720x1280)
//   soul5-meta.json (where the pendant is in each frame: its centre and height)
// Needs Chromium (Playwright) and three (lumera/node_modules).
// Usage: node soul5-frames.mjs [d|m|both] [first] [last]
import fs from "node:fs";
import path from "node:path";
import pw from "../node_modules/playwright-core/index.js";
const HERE = path.dirname(new URL(import.meta.url).pathname), NM = path.join(HERE, "../node_modules");
const N = 150, OUT = path.join(HERE, "public/f/soul5"), META = path.join(HERE, "soul5-meta.json");
const [which = "both", from = 0, to = N - 1] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const { MARK, MARK_W } = await import("./src/body.mjs");
const PAVE = JSON.parse(fs.readFileSync(path.join(HERE, "soul-pave.json"), "utf8"));
const meta = fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, "utf8")) : {};
const SETS = [{ k: "d", W: 1920, H: 1080, tall: false }, { k: "m", W: 720, H: 1280, tall: true }].filter(s => which === "both" || which === s.k);
const b = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await b.newPage();
page.on("console", m => { if (m.type() === "error" || m.type() === "warning") console.log("page:", m.text().slice(0, 400)); });
await page.route("http://soul.local/**", r => {
  const u = new URL(r.request().url()).pathname;
  if (u === "/") return r.fulfill({ contentType: "text/html", body: `<!doctype html><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script><canvas id="c"></canvas><canvas id="o"></canvas>` });
  if (u === "/scene.js") return r.fulfill({ contentType: "text/javascript", path: path.join(HERE, "src/t4/soul5-scene.js") });
  if (u.startsWith("/three/")) return r.fulfill({ contentType: "text/javascript", path: path.join(NM, u) });
  return r.fulfill({ status: 404, body: "" });
});
await page.goto("http://soul.local/");
for (const S of SETS) {
  meta[S.k] = meta[S.k] || new Array(N).fill(null);
  const info = await page.evaluate(async ({ S, MARK, MARK_W, PAVE }) => {
    const { makeSoul } = await import("/scene.js");
    window.SC = makeSoul(document.getElementById("c"), { MARK, MARK_W, PAVE, W: S.W, H: S.H, ratio: 1.5, tall: S.tall });
    const o = document.getElementById("o"); o.width = S.W; o.height = S.H;
    return { stones: SC.stones, beads: SC.beads, links: SC.links, stations: SC.stations };
  }, { S, MARK, MARK_W, PAVE });
  console.log(S.k, JSON.stringify(info));
  for (let i = +from; i <= +to; i++) {
    const r = await page.evaluate(({ i, W, H }) => {
      const m = SC.frame(i), o = document.getElementById("o"), x = o.getContext("2d");
      x.clearRect(0, 0, W, H); x.imageSmoothingQuality = "high";
      /* the opening comes into focus as the camera draws back */
      x.filter = i < 10 ? `blur(${((10 - i) / 10 * W / 640).toFixed(2)}px)` : "none";
      x.drawImage(document.getElementById("c"), 0, 0, W, H); x.filter = "none";
      return { url: o.toDataURL("image/webp", 0.88), m };
    }, { i, W: S.W, H: S.H });
    fs.writeFileSync(path.join(OUT, `${S.k}-${String(i).padStart(3, "0")}.webp`), Buffer.from(r.url.split(",")[1], "base64"));
    meta[S.k][i] = [+r.m.cx.toFixed(4), +r.m.cy.toFixed(4), +r.m.h.toFixed(4)];
    process.stdout.write(`${S.k}${i} `);
  }
}
fs.writeFileSync(META, JSON.stringify(meta));
await b.close();
console.log("\nsoul5 frames written");
