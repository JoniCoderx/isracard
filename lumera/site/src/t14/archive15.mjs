// Up close as "The private archive" (test14, the house's brief of 5 Nov 2026): the drawer is a path-traced render
// (website/tools/archive-drawer.py); the jewellery and the prints are drawn live over it by public/archive15/archive.js
// with the render's own camera, from public/archive15/config.json. This step shows the house the two proof frames
// (desktop and phone), path traced with all four pieces, before the scroll-driven build. Under it, plain links to the pieces for anyone the 3D
// layer cannot reach.
export function archive15() {
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
