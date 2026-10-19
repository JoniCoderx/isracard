// SOUL on white (/test6/), the frames as the page plays them: each master
// of soul6-frames.mjs (.soul6-raw) is set on the page's own white (#faf9f7),
// with the house's name drawn large behind the piece while the camera draws
// back from the metal (it eases a little nearer as it is revealed and goes as
// the pendant begins to turn), and kept as a plain JPEG: nothing to blend on
// the reader's device, and the quickest picture there is to decode.
//   public/f/soul6/d-NNN.jpg (wide screens, 1920x1080)
//   public/f/soul6/m-NNN.jpg (phones, 720x1280)
// The name is the wordmark as the site sets it: Urbanist 500, letters spaced
// by 0.3 em. Needs Chromium (Playwright).
// Usage: node soul6-compose.mjs [d|m|both] [first] [last]
import fs from "node:fs";
import path from "node:path";
import pw from "../node_modules/playwright-core/index.js";
const HERE = path.dirname(new URL(import.meta.url).pathname), RAW = path.join(HERE, ".soul6-raw"), OUT = path.join(HERE, "public/f/soul6");
const N = 150, BG = "#faf9f7";
const [which = "both", from = 0, to = N - 1] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const META = JSON.parse(fs.readFileSync(path.join(HERE, "soul6-meta.json"), "utf8"));
const font = fs.readdirSync(path.join(HERE, "public/fonts")).find(f => /^urbanist-normal-all-[0-9a-f]{6}\.woff2$/.test(f));
const b = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const page = await b.newPage();
await page.route("http://compose.local/**", r => {
  const u = decodeURIComponent(new URL(r.request().url()).pathname);
  if (u === "/") return r.fulfill({ contentType: "text/html", body: `<!doctype html><style>@font-face{font-family:W;font-weight:500;src:url(/font.woff2) format('woff2')}</style><canvas id="o"></canvas>` });
  if (u === "/font.woff2") return r.fulfill({ contentType: "font/woff2", path: path.join(HERE, "public/fonts", font) });
  if (u.startsWith("/raw/")) return r.fulfill({ contentType: "image/webp", path: path.join(RAW, path.basename(u)) });
  return r.fulfill({ status: 404, body: "" });
});
await page.goto("http://compose.local/");
await page.evaluate(() => document.fonts.load("500 100px W"));
const ease = x => (x = Math.min(1, Math.max(0, x)), x * x * (3 - 2 * x));
for (const k of ["d", "m"].filter(k => which === "both" || which === k)) {
  const [W, H] = k === "d" ? [1920, 1080] : [720, 1280];
  for (let i = +from; i <= +to; i++) {
    const name = `${k}-${String(i).padStart(3, "0")}`;
    if (!fs.existsSync(path.join(RAW, name + ".webp"))) continue;
    /* the name: revealed as the camera draws back (it is behind the metal
       until then), a little nearer at first, gone as the turn begins */
    const o = 1 - ease((i - 31) / 9), s = 1.06 - 0.06 * ease((i - 8) / 21);
    const cy = k === "d" ? 0.5 : (META.m[29] || [0.5, 0.37])[1];
    const q = k === "d" ? 0.8 : 0.78;
    const url = await page.evaluate(async ({ W, H, name, o, s, cy, BG, q }) => {
      const im = new Image(); im.src = "/raw/" + name + ".webp"; await im.decode();
      const c = document.getElementById("o"); c.width = W; c.height = H;
      const x = c.getContext("2d", { alpha: false });
      x.fillStyle = BG; x.fillRect(0, 0, W, H);
      if (o > 0.001) {
        x.save(); x.globalAlpha = o;
        /* as wide as 80% of the frame (88% on a phone), measured, not guessed */
        x.font = "500 100px W"; x.letterSpacing = "30px";
        const w100 = x.measureText("SILAVU").width - 30, size = (W > H ? 0.8 : 0.88) * W / w100 * 100 * s;
        x.font = `500 ${size}px W`; x.letterSpacing = (0.3 * size) + "px"; x.textAlign = "center"; x.textBaseline = "middle";
        /* platinum, faint: lighter at the top, a shade deeper below */
        const g = x.createLinearGradient(0, H * cy - size * 0.5, 0, H * cy + size * 0.5);
        g.addColorStop(0, "#ece9e4"); g.addColorStop(1, "#dcd7cf");
        x.fillStyle = g;
        /* letter spacing adds after the last letter too: centred on the letters */
        x.fillText("SILAVU", W / 2 + 0.15 * size, H * cy + size * 0.04);
        x.restore();
      }
      x.drawImage(im, 0, 0, W, H);
      return c.toDataURL("image/jpeg", q);
    }, { W, H, name, o, s, cy, BG, q });
    fs.writeFileSync(path.join(OUT, name + ".jpg"), Buffer.from(url.split(",")[1], "base64"));
  }
  console.log(k, "composed");
}
await b.close();
