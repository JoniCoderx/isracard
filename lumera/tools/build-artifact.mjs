// Build the self-contained SILAVU artifact from the source page + media.
// Embeds the ping-pong film (WebM + MP4 fallback), a poster frame, and the photo slots as data URIs.
// Usage: node tools/build-artifact.mjs <silavu-src.html> <out.html> [mediaDir]
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [src, out, mediaArg] = process.argv.slice(2);
const media = mediaArg || path.resolve(process.cwd(), "media");
if (!src || !out) { console.error("usage: build-artifact.mjs <src.html> <out.html> [mediaDir]"); process.exit(1); }

const b64 = (file, mime) => `data:${mime};base64,` + fs.readFileSync(file).toString("base64");
const jpeg = async (file, width, quality) => "data:image/jpeg;base64," +
  (await sharp(file).rotate().resize({ width, height: width, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality, progressive: true, mozjpeg: true }).toBuffer()).toString("base64");

let html = fs.readFileSync(src, "utf8");
const webm = path.join(media, "silavu-loop.webm"), mp4 = path.join(media, "silavu-loop.mp4");
html = html.replace("__WEBM__", b64(webm, "video/webm")).replace("__MP4__", b64(mp4, "video/mp4"));
html = html.replace("__POSTER__", await jpeg(path.join(media, "line.jpg"), 720, 70));

const KEYS = ["vault", "line", "ring", "riv", "star", "sapphire"];
const photos = {};
for (const k of KEYS) {
  const f = ["jpg", "jpeg", "png", "webp"].map(e => path.join(media, `${k}.${e}`)).find(p => fs.existsSync(p));
  photos[k] = f ? await jpeg(f, 1400, 80) : "";
}
const re = /window\.PHOTOS\s*=\s*\{[\s\S]*?\};/;
if (!re.test(html)) { console.error("PHOTOS block not found"); process.exit(1); }
html = html.replace(re, "window.PHOTOS = " + JSON.stringify(photos) + ";");
fs.writeFileSync(out, html);
console.log(`built ${out}: ${(html.length / 1024 / 1024).toFixed(2)} MB; photos: ${KEYS.filter(k => photos[k]).join(", ") || "none"}`);
