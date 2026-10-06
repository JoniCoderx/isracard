/* Every photograph the page asks for has to exist at every width it asks for.
   ────────────────────────────────────────────────────────────────────────────
   The collection's cards are built in the browser from the catalogue, so a
   missing derivative is invisible to anything that only reads the HTML: the
   build stays green, the page renders, and the card is empty. That is exactly
   what happened — a glob in piece-assets.sh skipped two of the three pieces and
   the bracelet and the ring went live with no photography at any width.

   This reads the catalogue itself, works out every file the page can ask for,
   and fails the build if one of them is not on disk. Run after the asset steps.

     node check-assets.mjs dist                                              */

import fs from "fs";
import path from "path";
import { PIECES, SOON } from "./src/content/load.mjs";

const out = process.argv[2] || "dist";
const img = path.join(out, "img");
const missing = [];
const seen = new Set();

const want = (name, widths) => {
  for (const w of widths) {
    const f = `${name}-${w}.jpg`;
    if (seen.has(f)) continue;
    seen.add(f);
    if (!fs.existsSync(path.join(img, f))) missing.push(f);
  }
};

/* the catalogue: every shot of every piece, at every width that piece declares */
let shots = 0;
for (const p of PIECES) {
  const widths = p.widths || [800, 1200, 1600, 2000];
  for (const s of p.shots || []) { want(s.img, widths); shots++; }
}

/* and everything the built page names outright */
const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
const literal = new Set();
for (const m of html.matchAll(/(?:^|["'(,\s])\/?img\/([A-Za-z0-9._-]+\.(?:jpg|png|webp))/g)) literal.add(m[1]);
for (const f of literal) {
  if (seen.has(f)) continue;
  seen.add(f);
  if (!fs.existsSync(path.join(img, f))) missing.push(f);
}

console.log(`checked ${seen.size} files: ${PIECES.length} pieces (${shots} shots), ${SOON.length} still to come, ${literal.size} named in the page`);
if (missing.length) {
  console.error(`\nMISSING ${missing.length}:`);
  for (const f of missing.slice(0, 40)) console.error("  img/" + f);
  if (missing.length > 40) console.error(`  … and ${missing.length - 40} more`);
  process.exit(1);
}
console.log("every photograph the page asks for is on disk");
