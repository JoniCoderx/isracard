// "ICON, from one stone" (/test4/), rendered once: the scene of
// src/t4/icon-scene.js (three.js) frame by frame, with the floating round
// brilliant of the opening traced by src/t4/gem.js and laid over it. The
// page plays these frames with the scroll; the reader's device does no 3D.
//   public/f/icon/d-NNN.webp (wide screens, 1920x1080)
//   public/f/icon/m-NNN.webp (phones, 900x1600)
// Needs Chromium (Playwright) and three (lumera/node_modules).
// Usage: node icon-frames.mjs [d|m|both] [first] [last]
import fs from "node:fs";
import path from "node:path";
import pw from "../node_modules/playwright-core/index.js";
const HERE = path.dirname(new URL(import.meta.url).pathname), NM = path.join(HERE, "../node_modules");
const N = 120, OUT = path.join(HERE, "public/f/icon");
const [which = "both", from = 0, to = N - 1] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const { MARK, MARK_W } = await import("./src/body.mjs");
const PAVE = JSON.parse(fs.readFileSync(path.join(HERE, "icon-pave.json"), "utf8"));
const SETS = [{ k: "d", W: 1920, H: 1080, tall: false }, { k: "m", W: 900, H: 1600, tall: true }].filter(s => which === "both" || which === s.k);
const b = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await b.newPage();
/* the page and its modules are served from disk under a made-up origin */
await page.route("http://icon.local/**", r => {
  const u = new URL(r.request().url()).pathname;
  if (u === "/") return r.fulfill({ contentType: "text/html", body: `<!doctype html><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script><canvas id="c"></canvas><canvas id="g"></canvas><canvas id="o"></canvas><script src="/gem.js"></script>` });
  if (u === "/gem.js") return r.fulfill({ contentType: "text/javascript", path: path.join(HERE, "src/t4/gem.js") });
  if (u === "/scene.js") return r.fulfill({ contentType: "text/javascript", path: path.join(HERE, "src/t4/icon-scene.js") });
  if (u.startsWith("/three/")) return r.fulfill({ contentType: "text/javascript", path: path.join(NM, u) });
  return r.fulfill({ status: 404, body: "" });
});
await page.goto("http://icon.local/");
for (const S of SETS) {
  await page.evaluate(async ({ S, MARK, MARK_W, PAVE }) => {
    const { makeScene } = await import("/scene.js");
    const c = document.getElementById("c");
    window.SC = makeScene(c, { MARK, MARK_W, PAVE, W: S.W, H: S.H, ratio: 1.5, tall: S.tall });
    const g = document.getElementById("g"); g.width = g.height = 900;
    window.GEM = SilavuGem(g, { bounces: 8, lw: 1.5 });
    const o = document.getElementById("o"); o.width = S.W; o.height = S.H;
  }, { S, MARK, MARK_W, PAVE });
  for (let i = +from; i <= +to; i++) {
    const t = i / (N - 1);
    const url = await page.evaluate(({ t, W, H }) => {
      const h = SC.frame(t), o = document.getElementById("o"), x = o.getContext("2d");
      x.imageSmoothingQuality = "high";
      x.drawImage(document.getElementById("c"), 0, 0, W, H);
      if (h.hero > 0.002) {
        /* the stone, traced: its girdle as wide as the stone in the scene */
        const size = 0.3, R = h.r * W, side = R / size;
        GEM.draw({ tilt: 0.42, spin: h.spin, yaw: 0, wire: 0, lit: 1, size, y: 0.3 });
        x.globalAlpha = h.hero; x.drawImage(document.getElementById("g"), h.x * W - side / 2, h.y * H - side / 2 - 0.0 * side, side, side); x.globalAlpha = 1;
      }
      return o.toDataURL("image/webp", 0.86);
    }, { t, W: S.W, H: S.H });
    fs.writeFileSync(path.join(OUT, `${S.k}-${String(i).padStart(3, "0")}.webp`), Buffer.from(url.split(",")[1], "base64"));
    process.stdout.write(`${S.k}${i} `);
  }
}
await b.close();
console.log("\nicon frames written");
