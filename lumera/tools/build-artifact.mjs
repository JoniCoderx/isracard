// Build the self-contained SILAVU artifact from the source page + media.
// Embeds the film frame sequence (scroll-scrubbed), a poster, and the photo slots as data URIs.
// Usage: node tools/build-artifact.mjs <silavu-src.html> <out.html> [mediaDir]
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [src, out, mediaArg] = process.argv.slice(2);
const media = mediaArg || path.resolve(process.cwd(), "media");
if (!src || !out) { console.error("usage: build-artifact.mjs <src.html> <out.html> [mediaDir]"); process.exit(1); }

const jpeg = async (file, width, quality) => "data:image/jpeg;base64," +
  (await sharp(file).rotate().resize({ width, height: width, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality, progressive: false, mozjpeg: true }).toBuffer()).toString("base64");

let html = fs.readFileSync(src, "utf8");

// Film frames: media/frames/f001.jpg … in shot order (bracelet lifted → at rest). The page scrubs them
// from rest to lifted as the visitor scrolls, so they are embedded reversed.
const framesDir = path.join(media, "frames");
const frameFiles = fs.existsSync(framesDir) ? fs.readdirSync(framesDir).filter(f => /\.jpe?g$/i.test(f)).sort() : [];
const frames = [];
let bytes = 0;
for (const f of frameFiles) { const d = await jpeg(path.join(framesDir, f), 1244, 72); frames.push(d); bytes += d.length; }
frames.reverse();
html = html.replace(/window\.FILM\s*=\s*\[[\s\S]*?\];/, "window.FILM = " + JSON.stringify(frames) + ";");
html = html.replace("__POSTER__", frames.length ? frames[0] : "");

const KEYS = ["line", "ring", "riv", "star", "sapphire"];
const photos = {};
for (const k of KEYS) {
  const f = ["jpg", "jpeg", "png", "webp"].map(e => path.join(media, `${k}.${e}`)).find(p => fs.existsSync(p));
  photos[k] = f ? await jpeg(f, 1400, 84) : "";
}
const re = /window\.PHOTOS\s*=\s*\{[\s\S]*?\};/;
if (!re.test(html)) { console.error("PHOTOS block not found"); process.exit(1); }
html = html.replace(re, "window.PHOTOS = " + JSON.stringify(photos) + ";");
fs.writeFileSync(out, html);
console.log(`built ${out}: ${(html.length / 1024 / 1024).toFixed(2)} MB; ${frames.length} film frames (${(bytes / 1024 / 1024).toFixed(2)} MB); photos: ${KEYS.filter(k => photos[k]).join(", ") || "none"}`);
