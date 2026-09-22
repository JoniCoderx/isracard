/* The catalogue.
   ────────────────────────────────────────────────────────────────────────────
   Every piece in the Collection is one object in this list, and everything the
   site shows about it — the card, the gallery, the specification table, the
   reservation — is rendered from here. Adding the necklace, the earrings, the
   ring or a tennis line later is adding an object; nothing else has to move.

   shots[0] is the card's front, shots[1] is the frame it turns over to, and
   the whole array is the gallery in the piece window.

   Values marked PROVISIONAL are placeholders in house format, ready to be
   replaced with the real workshop figures. */

export const CATS = [
  { id: "all",       en: "All",        he: "הכל" },
  { id: "bracelets", en: "Bracelets",  he: "צמידים" },
  { id: "necklaces", en: "Necklaces",  he: "שרשראות" },
  { id: "earrings",  en: "Earrings",   he: "עגילים" },
  { id: "rings",     en: "Rings",      he: "טבעות" },
  { id: "tennis",    en: "Tennis",     he: "טניס" }
];

const S = (en, he) => ({ en, he });

export const PIECES = [
  {
    id: "knot", cat: "bracelets", ref: "SLV·B·001", light: true,   /* shot on white */
    name: S("The <em>Knot</em>", "<em>הקשר</em>"),
    plain: "The Knot",
    line: S("The house mark, cast whole and polished, on a chain that never comes off.",
            "סמל הבית, יצוק בשלמותו ומלוטש, על שרשרת שלא יורדת."),
    shots: [
      { img: "knot-flat",  alt: S("The Knot bracelet laid open, the SILAVU mark at its centre", "צמיד הקשר פרוש, סמל סילאבו במרכזו") },
      { img: "knot-worn",  alt: S("Three Knot bracelets stacked on a wrist", "שלושה צמידי הקשר על פרק יד") },
      { img: "knot-macro", alt: S("The SILAVU mark at the centre of the Knot bracelet, close", "סמל סילאבו במרכז צמיד הקשר, מקרוב") },
      { img: "knot-clasp", alt: S("The lobster clasp and the engraved SILAVU plaque", "האבזם והלוחית החרוטה של סילאבו") },
      { img: "knot-full",  alt: S("The Knot bracelet, full length, on white", "צמיד הקשר במלואו, על רקע לבן") }
    ],
    /* the four figures the card shows under the name */
    meta: [S("18K white gold", "זהב לבן 18K"), S("16–19 cm", "16–19 ס\"מ"), S("Polished", "מלוטש"), S("Price on request", "מחיר לפי בקשה")],
    specs: [
      [S("Reference", "מק\"ט"),        S("SLV·B·001", "SLV·B·001")],
      [S("Metal", "מתכת"),             S("18K white gold", "זהב לבן 18K")],            /* PROVISIONAL */
      [S("Finish", "גימור"),           S("High polish", "ליטוש מלא")],
      [S("Centre motif", "המוטיב"),    S("The SILAVU mark · 12.4 × 14.2 mm", "סמל סילאבו · 12.4 × 14.2 מ\"מ")],  /* PROVISIONAL */
      [S("Chain", "שרשרת"),            S("Rolo, 1.8 mm", "רולו, 1.8 מ\"מ")],            /* PROVISIONAL */
      [S("Length", "אורך"),            S("16–19 cm, adjustable", "16–19 ס\"מ, מתכוונן")],
      [S("Clasp", "סגר"),              S("Lobster, engraved house plaque", "סגר לובסטר, לוחית בית חרוטה")],
      [S("Weight", "משקל"),            S("4.6 g", "4.6 גרם")],                          /* PROVISIONAL */
      [S("Stones", "אבנים"),           S("None. Pav&eacute; to order.", "ללא. פאווה לפי הזמנה.")],
      [S("Made", "ייצור"),             S("Dubai, by hand", "דובאי, בעבודת יד")],
      [S("Delivery", "אספקה"),         S("4–6 weeks", "4–6 שבועות")]                     /* PROVISIONAL */
    ],
    reserve: true
  }  ,{
    id: "star", cat: "necklaces", ref: "SLV·N·001",
    name: S("The Desert <em>Star</em>", "<em>כוכב</em> המדבר"),
    plain: "The Desert Star",
    line: S("One stone this big. When it goes, it is gone.",
            "אבן אחת בגודל כזה. כשהיא הולכת, היא הלכה."),
    shots: [
      { img: "star-worn", alt: S("The Desert Star worn at the throat", "כוכב המדבר ענוד על הצוואר") },
      { img: "star",      alt: S("The Desert Star, an eighteen carat brilliant in a radiating halo", "כוכב המדבר, בריליאנט 18 קראט בהילה קורנת") }
    ],
    meta: [S("18.06 ct", "18.06 ct"), S("D · IF", "D · IF"), S("Platinum", "פלטינה"), S("Price on request", "מחיר לפי בקשה")],
    specs: [
      [S("Reference", "מק\"ט"),   S("SLV·N·001", "SLV·N·001")],
      [S("Centre stone", "אבן מרכזית"), S("18.06 ct round brilliant", "18.06 ct בריליאנט עגול")],
      [S("Colour", "צבע"),        S("D", "D")],
      [S("Clarity", "ניקיון"),     S("Internally flawless", "ללא רבב פנימי")],
      [S("Certificate", "תעודה"),  S("GIA", "GIA")],
      [S("Metal", "מתכת"),        S("Platinum", "פלטינה")],
      [S("Halo", "הילה"),         S("Tapered baguettes, radiating", "בגטים מתחדדים, קורנים")],
      [S("Made", "ייצור"),         S("Dubai, by hand. Once.", "דובאי, בעבודת יד. פעם אחת.")]
    ],
    reserve: true
  }
];

/* What is still to come. These render as quiet, un-clickable cards so the
   shape of the collection is visible before the photography exists — and so
   the grid never reflows when a piece lands. */
export const SOON = [
  { cat: "necklaces", name: S("The Knot <em>Pendant</em>", "<em>תליון</em> הקשר") },
  { cat: "earrings",  name: S("The Knot <em>Earrings</em>", "<em>עגילי</em> הקשר") },
  { cat: "rings",     name: S("The Knot <em>Ring</em>", "<em>טבעת</em> הקשר") },
  { cat: "tennis",    name: S("The <em>Line</em>", "<em>הקו</em>") }
];
