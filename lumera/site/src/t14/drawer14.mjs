// Up close as "The Private Drawer" (test14 only, the house's brief of 5 Nov 2026): a smoked-wood drawer lined with
// stone suede opens as the section arrives; three Polaroids of the house's own campaign portraits lie in it, each
// beside its own piece (the house's own cut-out photographs). A Polaroid lifts on hover; a click carries that same
// print out of the drawer into a focused view, where a hotspot on the jewellery opens the piece's own photograph.
// Everything shown is the house's: the three portraits (public/models), the three pieces (public/cut8), their names
// and their one-line descriptions from the catalogue (src/pieces.mjs). Nothing is invented.
export function drawer14(PIECES) {
  const q = v => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const plain = s => String(s).replace(/<[^>]+>/g, "");
  const E = x => `data-en="${q(x.en)}" data-he="${q(x.he)}"`;
  const items = [
    // the pieces: the ring stands in the suede and the bracelet lies as photographed (both turned to face the camera, with
    // their shadows cast on the suede); the necklace lies flat with its chain running under the print
    // hx / hy: where the piece is worn in the portrait, in % of the photograph (measured on models/*-900.jpg)
    { id: "ring", img: "ring", cut: "cut8/ring-1200.webp", cw: 940, ch: 423, r: -2.6, hx: 64, hy: 57,
      alt: { en: "A woman wearing the SILAVU ICON ring, her hand resting at her jaw", he: "אישה עונדת את טבעת SILAVU ICON, ידה מונחת על קו הלסת" } },
    { id: "pave", img: "necklace", cut: "cut8/pave-hero-1200.webp", cw: 1134, ch: 978, r: 1.8, hx: 53, hy: 61,
      alt: { en: "A woman wearing the SILAVU SOUL necklace, the pendant below her collarbones", he: "אישה עונדת את שרשרת SILAVU SOUL, התליון מתחת לעצמות הבריח" } },
    { id: "knot", img: "bracelet", cut: "cut8/knot-1200.webp", cw: 1077, ch: 714, r: -1.4, hx: 53, hy: 69,
      alt: { en: "A woman wearing the SILAVU MOMENT bracelet, her hand on her shoulder", he: "אישה עונדת את צמיד SILAVU MOMENT, ידה על כתפה" } }
  ].map(l => ({ ...l, p: PIECES.find(x => x.id === l.id) })).filter(l => l.p);
  if (items.length !== 3) return "";
  const short = l => plain(l.p.name.en).replace(/^SILAVU\s+/, "");
  const item = (l, i) => `<li class="pd14it" data-i="${i}" style="--r:${l.r}deg" data-id="${l.p.id}" data-href="pieces/${l.p.id}/" data-cut="${l.cut}" data-cw="${l.cw}" data-ch="${l.ch}" data-big="models/${l.img}-1400.jpg" data-hx="${l.hx}" data-hy="${l.hy}" data-name="${q(plain(l.p.name.en))}" data-kind-en="${q(l.p.kind.en)}" data-kind-he="${q(l.p.kind.he)}" data-sub-en="${q(l.p.sub.en)}" data-sub-he="${q(l.p.sub.he)}">
          <button class="pd14pol" type="button" aria-haspopup="dialog" aria-controls="pd14focus" aria-label="${q(plain(l.p.name.en))}, ${q(l.p.kind.en)}" data-aria-he="${q(plain(l.p.name.he))}, ${q(l.p.kind.he)}">
            <span class="pd14sh" aria-hidden="true"></span>
            <span class="pd14paper"><span class="pd14pic"><img src="models/${l.img}-900.jpg" srcset="models/${l.img}-900.jpg 900w, models/${l.img}-1400.jpg 1400w" sizes="(max-width: 899px) 70vw, 22vw" width="900" height="1126" loading="lazy" decoding="async" alt="${q(l.alt.en)}" data-alt-he="${q(l.alt.he)}"></span><span class="pd14cap">SILAVU ${q(short(l))}</span><i class="pd14m" data-c="0"></i><i class="pd14m" data-c="1"></i><i class="pd14m" data-c="2"></i><i class="pd14m" data-c="3"></i></span>
          </button>
          <span class="pd14jw" data-k="${l.id}" aria-hidden="true"><img class="pd14js" src="${l.cut}" width="${l.cw}" height="${l.ch}" alt="" loading="lazy" decoding="async"><img class="pd14js pd14jc" src="${l.cut}" width="${l.cw}" height="${l.ch}" alt="" loading="lazy" decoding="async"><img class="pd14ji" src="${l.cut}" width="${l.cw}" height="${l.ch}" alt="" loading="lazy" decoding="async"></span>
        </li>`;
  const dot = (l, i) => `<button class="pd14dot" type="button" data-i="${i}" aria-controls="pd14focus"><i aria-hidden="true"></i><span>${q(short(l))}</span></button>`;
  return `<section id="details" class="pd14" data-n="" data-title-en="Up close" data-title-he="מקרוב" aria-labelledby="pdh">
  <div class="pd14hd">
    <p class="pd14k" ${E({ en: "Up close · The private collection", he: "מקרוב · האוסף הפרטי" })}>Up close · The private collection</p>
    <h2 class="pd14h" id="pdh" ${E({ en: "Reserved for a closer look.", he: "שמור למבט מקרוב." })}>Reserved for a closer look.</h2>
  </div>
  <div class="pd14stage">
    <div class="pd14world">
      <div class="pd14cab" aria-hidden="true"><i class="pd14cabtop"></i></div>
      <div class="pd14drawer">
        <div class="pd14floor" aria-hidden="true"><i class="pd14lt"></i><i class="pd14ao"></i></div>
        <i class="pd14w pd14wl" aria-hidden="true"></i><i class="pd14w pd14wr" aria-hidden="true"></i><i class="pd14w pd14wb" aria-hidden="true"></i>
        <ul class="pd14items" role="list">
        ${items.map(item).join("\n        ")}
        </ul>
        <i class="pd14w pd14wf" aria-hidden="true"><b class="pd14pull"></b></i>
      </div>
    </div>
  </div>
  <p class="pd14hint" ${E({ en: "Choose a portrait to discover the piece", he: "בחרו דיוקן כדי לגלות את התכשיט" })}>Choose a portrait to discover the piece</p>
  <div class="pd14nav">${items.map(dot).join("")}</div>
  <div class="pd14focus" id="pd14focus" role="dialog" aria-modal="true" aria-labelledby="pd14fn" hidden>
    <div class="pd14bd"></div>
    <div class="pd14info">
      <p class="pd14fk"></p>
      <h3 class="pd14fn" id="pd14fn"></h3>
      <p class="pd14fs"></p>
      <figure class="pd14cu" hidden><img alt="" decoding="async"><figcaption></figcaption></figure>
      <a class="pd14go" href="#"><span ${E({ en: "Explore the piece", he: "לגלות את התכשיט" })}>Explore the piece</span><i aria-hidden="true"></i></a>
    </div>
    <button class="pd14x" type="button" aria-label="Close" data-aria-he="סגירה"></button>
  </div>
</section>
`;
}
