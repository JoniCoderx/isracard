// Up close as "The private archive" (test14, the house's brief of 5 Nov 2026): the drawer is a path-traced render
// (website/tools/archive-drawer.py); the jewellery and the prints are drawn live over it by public/archive15/archive.js
// with the render's own camera, from public/archive15/config.json. This is the proof frame the house asked to see
// first: the drawer open, ICON and SOUL in it, and the prints. Under it, plain links to the pieces for anyone the 3D
// layer cannot reach.
export function archive15() {
  const E = (en, he) => `data-en="${en}" data-he="${he}"`;
  return `<section id="details" class="ar15" data-n="" data-title-en="Up close" data-title-he="מקרוב" aria-labelledby="arh">
  <div class="ar15hd">
    <p class="ar15k" ${E("Up close · The private collection", "מקרוב · האוסף הפרטי")}>Up close · The private collection</p>
    <h2 class="ar15h" id="arh" ${E("Reserved for a closer look.", "שמור למבט מקרוב.")}>Reserved for a closer look.</h2>
  </div>
  <div class="ar15stage">
    <img class="ar15bg" src="archive15/open-d.webp" width="1920" height="1080" alt="A private jewellery drawer of dark lacquered wood, open, lined in champagne suede" data-alt-he="מגירת תכשיטים פרטית מעץ לכה כהה, פתוחה, מרופדת זמש בגוון שמפניה" loading="lazy" decoding="async">
  </div>
  <nav class="ar15nav" aria-label="The pieces in the drawer" data-aria-he="התכשיטים במגירה">
    <a href="pieces/ring/">ICON</a><a href="pieces/pave/">SOUL</a><a href="pieces/knot/">MOMENT</a>
  </nav>
</section>
`;
}
