// Embed real photography into the SILAVU artifact.
// Looks for photos/<key>.{jpg,jpeg,png,webp} in the repo (keys: hero, ring, line, riv, star, sapphire),
// optimises with sharp (max 1800px, JPEG q78, progressive), base64-encodes, and injects into window.PHOTOS.
// Usage: node tools/embed-photos.mjs <path-to-silavu.html> [photosDir]
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const html = process.argv[2];
const dir = process.argv[3] || path.resolve(process.cwd(), "..", "photos");
if (!html || !fs.existsSync(html)) { console.error("html file not found:", html); process.exit(1); }
if (!fs.existsSync(dir)) { console.error("photos dir not found:", dir); process.exit(1); }

const KEYS = ["hero", "ring", "line", "riv", "star", "sapphire"];
const found = {};
for (const f of fs.readdirSync(dir)) {
  const m = f.toLowerCase().match(/^(hero|ring|line|riv|star|sapphire)\.(jpe?g|png|webp)$/);
  if (m) found[m[1]] = path.join(dir, f);
}
if (!Object.keys(found).length) { console.error("no matching photos in", dir, "— expected e.g. hero.jpg ring.jpg line.jpg"); process.exit(1); }

let total = 0;
const out = {};
for (const k of KEYS) {
  if (!found[k]) continue;
  const buf = await sharp(found[k]).rotate().resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 78, progressive: true, mozjpeg: true }).toBuffer();
  out[k] = "data:image/jpeg;base64," + buf.toString("base64");
  total += buf.length;
  console.log(`${k}: ${(buf.length / 1024).toFixed(0)} KB`);
}
console.log(`total embedded: ${(total / 1024 / 1024).toFixed(2)} MB`);

let src = fs.readFileSync(html, "utf8");
const re = /window\.PHOTOS\s*=\s*\{[\s\S]*?\};/;
if (!re.test(src)) { console.error("PHOTOS block not found in html"); process.exit(1); }
const block = "window.PHOTOS = " + JSON.stringify(Object.fromEntries(KEYS.map(k => [k, out[k] || ""]))) + ";";
src = src.replace(re, block);
fs.writeFileSync(html, src);
console.log("injected into", html);
