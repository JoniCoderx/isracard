// Up close as "The private archive" (test14, the house's brief of 5 Nov 2026). The drawer and everything in it are
// path traced (website/tools/archive-scene.py, archive-build.py); public/archive15/player.js scrubs the opening with
// the scroll and lifts each piece towards the viewer on a click, from public/archive15/<d|m>/manifest.json.
// The words here are the catalogue's own (src/pieces.mjs): each piece's name, kind and line, and its page.
// Without script (or before it loads) the approved still is shown, with plain links to the pieces.
export function archive15(PIECES) {
  const q = v => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const plain = s => String(s).replace(/<[^>]+>/g, "");
  const E = (en, he) => `data-en="${q(en)}" data-he="${q(he)}"`;
  const order = [["ring", "ICON"], ["pave", "SOUL"], ["knot", "MOMENT"], ["aura", "AURA"]];
  const picks = order.map(([id, word]) => { const p = PIECES.find(x => x.id === id); if (!p) return "";
    return `<button class="ar15pick" type="button" data-id="${id}" data-href="pieces/${id}/" data-name="${q(plain(p.name.en))}" data-kind-en="${q(p.kind.en)}" data-kind-he="${q(p.kind.he)}" data-line-en="${q(p.sub.en)}" data-line-he="${q(p.sub.he)}" aria-controls="ar15d">${word}</button>`; }).join("");
  const links = order.map(([id, word]) => `<a href="pieces/${id}/">${word}</a>`).join("");
  return `<section id="details" class="ar15" data-n="" data-title-en="Up close" data-title-he="מקרוב" aria-labelledby="arh">
  <div class="ar15hd">
    <p class="ar15k" ${E("Up close · The private collection", "מקרוב · האוסף הפרטי")}>Up close · The private collection</p>
    <h2 class="ar15h" id="arh" ${E("Reserved for a closer look.", "שמור למבט מקרוב.")}>Reserved for a closer look.</h2>
  </div>
  <div class="ar15run">
    <div class="ar15pin">
      <div class="ar15stage">
        <canvas class="ar15seq" aria-hidden="true"></canvas>
        <picture class="ar15still">
          <source media="(max-width: 899px), (orientation: portrait)" srcset="archive15/m/final.webp" width="1080" height="1920">
          <img src="archive15/d/final.webp" width="1920" height="1080" alt="The SILAVU private drawer, open: the AURA earrings on a dark suede stand, the SOUL necklace on champagne suede, the ICON ring resting on its band, the MOMENT bracelet lying open, and three prints of the house's campaign" data-alt-he="המגירה הפרטית של SILAVU, פתוחה: עגילי AURA על מעמד זמש כהה, שרשרת SOUL על זמש בגוון שמפניה, טבעת ICON נחה על הטבעת שלה, צמיד MOMENT שוכב פתוח, ושלושה הדפסים מהקמפיין של הבית" loading="lazy" decoding="async">
        </picture>
        <i class="ar15pool" aria-hidden="true"></i>
        <i class="ar15dim" aria-hidden="true"></i>
        <div class="ar15fx" aria-hidden="true"></div>
        <div class="ar15tag" aria-hidden="true"></div>
      </div>
      <p class="ar15cue" aria-hidden="true"><span ${E("Scroll to open", "גללו כדי לפתוח")}>Scroll to open</span></p>
      <div class="ar15detail" id="ar15d" role="dialog" aria-modal="false" aria-labelledby="ar15dn" hidden>
        <p class="ar15dk"></p>
        <h3 class="ar15dn" id="ar15dn"></h3>
        <p class="ar15dl"></p>
        <a class="ar15go" href="#"><span ${E("View the piece", "לצפייה בתכשיט")}>View the piece</span><i aria-hidden="true"></i></a>
        <button class="ar15x" type="button" aria-label="Close" data-aria-he="סגירה"></button>
      </div>
    </div>
  </div>
  <nav class="ar15nav" aria-label="The pieces in the drawer" data-aria-he="התכשיטים במגירה">${picks}<noscript>${links}</noscript></nav>
</section>
`;
}

/* the approved proof stills, shown until the scroll-driven build's renders are in public/archive15/<d|m>/ */
export function archive15Still() {
  const E = (en, he) => `data-en="${en}" data-he="${he}"`;
  return `<section id="details" class="ar15" data-n="" data-title-en="Up close" data-title-he="מקרוב" aria-labelledby="arh">
  <div class="ar15hd">
    <p class="ar15k" ${E("Up close · The private collection", "מקרוב · האוסף הפרטי")}>Up close · The private collection</p>
    <h2 class="ar15h" id="arh" ${E("Reserved for a closer look.", "שמור למבט מקרוב.")}>Reserved for a closer look.</h2>
  </div>
  <div class="ar15stage" data-mode="still">
    <picture>
      <source media="(max-width: 899px)" srcset="archive15/proof-m.webp" width="1080" height="1920">
      <img class="ar15bg" src="archive15/proof-d.webp" width="1920" height="1080" alt="The SILAVU private drawer, open: the AURA earrings on a dark suede stand, the SOUL necklace laid on champagne suede, the ICON ring resting on its band, the MOMENT bracelet lying open, and three prints of the house's campaign" data-alt-he="המגירה הפרטית של SILAVU, פתוחה: עגילי AURA על מעמד זמש כהה, שרשרת SOUL מונחת על זמש בגוון שמפניה, טבעת ICON נחה על הטבעת שלה, צמיד MOMENT שוכב פתוח, ושלושה הדפסים מהקמפיין של הבית" loading="lazy" decoding="async">
    </picture>
  </div>
  <nav class="ar15nav" aria-label="The pieces in the drawer" data-aria-he="התכשיטים במגירה">
    <a href="pieces/ring/">ICON</a><a href="pieces/pave/">SOUL</a><a href="pieces/knot/">MOMENT</a><a href="pieces/aura/">AURA</a>
  </nav>
</section>
`;
}
