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
  { id: "rings",     en: "Rings",      he: "טבעות" }
];

const S = (en, he) => ({ en, he });

export const PIECES = [
  {
    id: "knot", cat: "bracelets", ref: "SLV·B·001", light: true,   /* shot on white */
    widths: [640, 900, 1254],   /* what your photographs were actually shot at */
    name: S("The <em>Knot</em>", "<em>הקשר</em>"),
    plain: "The Knot",
    line: S("The house mark, cast whole and polished, on a chain that never comes off.",
            "סמל הבית, יצוק בשלמותו ומלוטש, על שרשרת שאין צורך להסיר."),
    shots: [
      { img: "knot-flat",  alt: S("The Knot bracelet laid open, the SILAVU mark at its centre", "צמיד הקשר פרוש, סמל סילאבו במרכזו") },
      { img: "knot-worn",  alt: S("Three Knot bracelets stacked on a wrist", "שלושה צמידי הקשר על פרק יד") },
      { img: "knot-macro", alt: S("The SILAVU mark at the centre of the Knot bracelet, close", "סמל סילאבו במרכז צמיד הקשר, מקרוב") },
      { img: "knot-clasp", alt: S("The lobster clasp and the engraved SILAVU plaque", "האבזם והלוחית החרוטה של סילאבו") },
      { img: "knot-full",  alt: S("The Knot bracelet, full length, on white", "צמיד הקשר במלואו, על רקע לבן") }
    ],
    /* the four figures the card shows under the name */
    meta: [S("18K white gold", "זהב לבן 18K"), S("16–19 cm", "16–19 ס\"מ"), S("Polished", "מלוטש"), S("Price on request", "מחיר לפי בקשה")],
    /* the three figures that sit above the fold of the piece window */
    key: [
      [S("Metal", "מתכת"),   S("18K white gold", "זהב לבן 18K")],
      [S("Length", "אורך"),  S("16–19 cm", "16–19 ס\"מ")],
      [S("Weight", "משקל"),  S("4.6 g", "4.6 גרם")]
    ],
    story: S("It is the house mark, cast in one piece rather than soldered from two, so the ribbon really does pass through itself and the light runs the whole way round without a seam to stop it. It is small on purpose — twelve millimetres across — because this is the bracelet you forget you are wearing. The chain is rolo, heavy enough to hang straight, and the clasp carries the name on a plaque you can read.",
             "זה סמל הבית, יצוק בחתיכה אחת ולא מולחם משני חלקים, כך שהסרט באמת עובר דרך עצמו והאור זורם סביבו בלי תפר שיקטע אותו. הוא קטן בכוונה — שנים־עשר מילימטר — כי זה הצמיד ששוכחים שהוא על היד. השרשרת בשזירת רולו, כבדה מספיק כדי ליפול ישר, והסגר נושא את השם על לוחית חרוטה."),
    stones: S("None as standard: this one is about the metal. The centre takes 0.42 ct of E VS pav&eacute; to order, thirty-one stones set by hand, and the certificates travel with it.",
              "בגרסה הבסיסית אין אבנים: כאן המתכת היא העיקר. לפי הזמנה אפשר לשבץ במרכז 0.42 ct של פאווה בדרגת E VS — שלושים ואחת אבנים משובצות ביד, בליווי תעודות."),
    care: S("Four to six weeks from the order, because it is cut, cast and polished for you. Resizing, cleaning and a check of the clasp are on the house, for as long as you own it.",
            "ארבעה עד שישה שבועות מההזמנה, כי הוא נוצק ומלוטש במיוחד עבורכם. שינוי מידה, ניקוי ובדיקת הסגר — על חשבון הבית, כל עוד התכשיט שלכם."),
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
    id: "ring", cat: "rings", ref: "SLV·R·001", light: true,   /* shot on white */
    widths: [640, 900, 1254],
    name: S("The Knot <em>Ring</em>", "<em>טבעת</em> הקשר"),
    plain: "The Knot Ring",
    line: S("The house mark set in pavé, on a band paved to the shoulders.",
            "סמל הבית משובץ בפאווה, על טבעת שמשובצת עד הכתפיים."),
    /* the gallery runs the way a jewellery house runs one: the piece on white,
       then worn, then the angle, then the mark close, then the signature */
    shots: [
      { img: "ring-front",  alt: S("The Knot Ring, the SILAVU mark in pavé on a band paved to the shoulders", "טבעת הקשר, סמל סילאבו בפאווה על טבעת שמשובצת עד הכתפיים") },
      { img: "ring-worn",   alt: S("The Knot Ring worn on the hand", "טבעת הקשר ענודה על היד") },
      { img: "ring-side",   alt: S("The Knot Ring from three quarters", "טבעת הקשר בזווית שלושת־רבעי") },
      { img: "ring-macro",  alt: S("The SILAVU mark on the Knot Ring, close", "סמל סילאבו על טבעת הקשר, מקרוב") },
      { img: "ring-signed", alt: S("SILAVU engraved inside the band of the Knot Ring", "סילאבו חרוט בתוך טבעת הקשר") }
    ],
    meta: [S("18K white gold", "זהב לבן 18K"), S("EU 47–58", "EU 47–58"), S("Pavé", "פאווה"), S("Price on request", "מחיר לפי בקשה")],
    key: [
      [S("Metal", "מתכת"),   S("18K white gold", "זהב לבן 18K")],
      [S("Size", "מידה"),    S("EU 47–58", "EU 47–58")],
      [S("Setting", "שיבוץ"), S("Pavé", "פאווה")]
    ],
    story: S("The mark again, but set rather than polished: stones follow its ribbon from end to end, and the two open loops are left bare so the eye still reads the knot passing through itself. The band is paved down both shoulders and runs plain and polished underneath, so it sits flat against the next finger. Inside it, where only you see it, the house signs its name.",
             "שוב הסמל, אבל משובץ ולא מלוטש: האבנים עוקבות אחרי הסרט שלו מקצה לקצה, ושתי הלולאות הפתוחות נשארות חלקות, כך שהעין עדיין רואה את הקשר עובר דרך עצמו. הטבעת משובצת לאורך שתי הכתפיים וחלקה ומלוטשת בחלקה התחתון, כך שהיא יושבת שטוח ליד האצבע הסמוכה. בפנים, במקום שרק אתם רואים, הבית חותם את שמו."),
    stones: S("Brilliants on the mark and down both shoulders, matched for colour so the tone does not change where the mark meets the band. The count and the total weight are stated on the certificate.",
              "יהלומי בריליאנט על הסמל ולאורך שתי הכתפיים, מותאמים בצבע כך שהגוון לא משתנה במעבר מהסמל לטבעת. מספר האבנים והמשקל הכולל מצוינים בתעודה."),
    care: S("Four to six weeks from the order. Sized to the half, and resizing, cleaning and a check of every stone under the loupe are on the house for as long as you own it.",
            "ארבעה עד שישה שבועות מההזמנה. מידות בחצאים; שינוי מידה, ניקוי ובדיקת כל אבן — על חשבון הבית, כל עוד הטבעת שלכם."),
    specs: [
      [S("Reference", "מק\"ט"),  S("SLV·R·001", "SLV·R·001")],
      [S("Metal", "מתכת"),          S("18K white gold", "זהב לבן 18K")],
      [S("Setting", "שיבוץ"),       S("Pavé on the mark and shoulders, grain-set by hand", "פאווה על הסמל והכתפיים, משובץ ביד")],
      [S("Motif", "המוטיב"),        S("The SILAVU mark", "סמל סילאבו")],
      [S("Size", "מידה"),           S("EU 47–58, to the half", "EU 47–58, בחצאי מידות")],
      [S("Signature", "חתימה"),     S("SILAVU, engraved inside the band", "סילאבו, חרוט בתוך הטבעת")],
      [S("Made", "ייצור"),          S("Dubai, by hand", "דובאי, בעבודת יד")]
    ],
    reserve: true
  }  ,{
    id: "pave", cat: "necklaces", ref: "SLV·N·003", light: true,   /* shot on white */
    widths: [640, 900, 1254],
    name: S("The Knot, <em>Pavé</em>", "הקשר, <em>פאווה</em>"),
    plain: "The Knot, Pavé",
    line: S("The mark set rather than polished, on a chain that carries stones of its own.",
            "הסמל משובץ ולא מלוטש, על שרשרת שנושאת אבנים משלה."),
    shots: [
      { img: "necklace-front",  alt: S("The Knot in pavé on a station chain, full length", "הקשר בפאווה על שרשרת תחנות, במלואה") },
      { img: "necklace-worn",   alt: S("The Knot in pavé worn at the collarbone", "הקשר בפאווה ענוד על עצם הבריח") },
      { img: "necklace-detail", alt: S("The pendant and the chain either side of it", "התליון והשרשרת משני צדיו") },
      { img: "necklace-macro",  alt: S("The SILAVU mark in pavé, close", "סמל סילאבו בפאווה, מקרוב") }
    ],
    meta: [S("18K white gold", "זהב לבן 18K"), S("42 cm", "42 ס\"מ"), S("Pavé", "פאווה"), S("Price on request", "מחיר לפי בקשה")],
    key: [
      [S("Metal", "מתכת"),   S("18K white gold", "זהב לבן 18K")],
      [S("Length", "אורך"),  S("42 cm", "42 ס\"מ")],
      [S("Setting", "שיבוץ"), S("Pavé", "פאווה")]
    ],
    story: S("The same mark as the bracelet and the ring, set rather than polished. The stones follow the ribbon the whole way round and the two open loops are left bare, so the knot still reads as passing through itself rather than as a shape filled in. The chain is not plain either: it carries stones of its own, set in rubover at intervals either side of the pendant, so the line to the throat is not empty.",
             "אותו סמל כמו בצמיד ובטבעת, משובץ ולא מלוטש. האבנים עוקבות אחרי הסרט לכל אורכו ושתי הלולאות הפתוחות נשארות חלקות, כך שהקשר עדיין נראה עובר דרך עצמו. גם השרשרת משובצת: יהלומים בשיבוץ סגור, במרווחים משני צדי התליון."),
    stones: S("Brilliants across the mark and in rubover along the chain, matched for colour so the tone does not change between the pendant and the stones that lead to it. The count and the total weight travel on the certificate.",
              "יהלומי בריליאנט על הסמל ובשיבוץ סגור לאורך השרשרת, מותאמים בצבע. מספר האבנים והמשקל הכולל מצוינים בתעודה."),
    care: S("Four to six weeks from the order. Shortening the chain, cleaning and a check of every setting under the loupe are on the house for as long as you own it.",
            "ארבעה עד שישה שבועות מההזמנה. קיצור השרשרת, ניקוי ובדיקת כל שיבוץ — על חשבון הבית, כל עוד התכשיט שלכם."),
    specs: [
      [S("Reference", "מק\"ט"),  S("SLV·N·003", "SLV·N·003")],
      [S("Metal", "מתכת"),          S("18K white gold", "זהב לבן 18K")],
      [S("Setting", "שיבוץ"),       S("Pavé on the mark, rubover on the chain", "פאווה על הסמל, שיבוץ סגור על השרשרת")],
      [S("Motif", "המוטיב"),        S("The SILAVU mark", "סמל סילאבו")],
      [S("Chain", "שרשרת"),          S("Cable, with set stations", "שרשרת כבל עם תחנות משובצות")],
      [S("Length", "אורך"),           S("42 cm", "42 ס\"מ")],
      [S("Made", "ייצור"),          S("Dubai, by hand", "דובאי, בעבודת יד")]
    ],
    reserve: true
  }  ,{
    id: "star", cat: "necklaces", ref: "SLV·N·001",
    widths: [800, 1200, 1600, 2000],
    /* Not of the collection. Every other piece here carries the house mark and
       can be made again; this is one stone, graded once, and there is no second
       of it. Standing it in a grid of monogram pieces made the grid read as a
       set it is not part of, so it is shown on its own below them. */
    exceptional: true,
    name: S("The Desert <em>Star</em>", "<em>כוכב</em> המדבר"),
    plain: "The Desert Star",
    line: S("Eighteen carats, D, internally flawless. There is one.",
            "שמונה־עשר קראט, צבע D, ללא פגמים פנימיים. יש רק אחת."),
    shots: [
      { img: "star-worn", alt: S("The Desert Star worn at the throat", "כוכב המדבר ענוד על הצוואר") },
      { img: "star",      alt: S("The Desert Star, an eighteen carat brilliant in a radiating halo", "כוכב המדבר, בריליאנט 18 קראט בהילה קורנת") }
    ],
    meta: [S("18.06 ct", "18.06 ct"), S("D · IF", "D · IF"), S("Platinum", "פלטינה"), S("Price on request", "מחיר לפי בקשה")],
    key: [
      [S("Centre stone", "אבן מרכזית"), S("18.06 ct", "18.06 ct")],
      [S("Grade", "דירוג"),             S("D · Internally flawless", "D · ללא פגמים פנימיים")],
      [S("Metal", "מתכת"),              S("Platinum", "פלטינה")]
    ],
    story: S("Eighteen carats is where a diamond stops being a stone and starts being a decision. This one came out of the rough at D colour and internally flawless, which is roughly one stone in several thousand at this weight, and the house bought it before it had a design. The halo is tapered baguettes, cut to fall away from the centre so nothing competes with it. There is one. There will not be another.",
             "בשמונה־עשר קראט יהלום מפסיק להיות אבן והופך להחלטה. האבן הזו יצאה מהגלם בצבע D וללא פגמים פנימיים — בערך אחת מכמה אלפים במשקל הזה — והבית רכש אותה עוד לפני שנולד העיצוב. ההילה עשויה בגטים מתחדדים, מלוטשים כך שיובילו את העין אל המרכז ולא יתחרו בו. יש רק אחת, ולא תהיה נוספת."),
    stones: S("One 18.06 ct round brilliant, D colour, internally flawless, with its GIA report. Forty-two tapered baguettes around it, F–G VS, matched for length within a tenth of a millimetre.",
              "בריליאנט עגול אחד במשקל 18.06 ct, צבע D, ללא פגמים פנימיים, עם תעודת GIA משלו. סביבו ארבעים ושניים בגטים מתחדדים בדרגת F–G VS, מותאמים באורכם בדיוק של עשירית מילימטר."),
    care: S("It exists. A private viewing in Dubai or Tel Aviv, and it travels to you with a courier and an appraiser, not in a parcel.",
            "התכשיט קיים ומוכן. הצפייה בפגישה פרטית בדובאי או בתל אביב, והמסירה על ידי שליח ושמאי — לא בחבילה."),
    specs: [
      [S("Reference", "מק\"ט"),   S("SLV·N·001", "SLV·N·001")],
      [S("Centre stone", "אבן מרכזית"), S("18.06 ct round brilliant", "18.06 ct בריליאנט עגול")],
      [S("Colour", "צבע"),        S("D", "D")],
      [S("Clarity", "ניקיון"),     S("Internally flawless", "ללא פגמים פנימיים")],
      [S("Certificate", "תעודה"),  S("GIA", "GIA")],
      [S("Metal", "מתכת"),        S("Platinum", "פלטינה")],
      [S("Halo", "הילה"),         S("Tapered baguettes, radiating", "בגטים מתחדדים, קורנים")],
      [S("Made", "ייצור"),         S("Dubai, by hand. Once.", "דובאי, בעבודת יד. עותק יחיד.")]
    ],
    reserve: true
  }
];

/* What is still to come. These render as quiet, un-clickable cards so the
   shape of the collection is visible before the photography exists — and so
   the grid never reflows when a piece lands. */
export const SOON = [
  { cat: "necklaces", ref: "SLV·N·002", when: S("Spring", "אביב"),
    name: S("The Knot <em>Pendant</em>", "<em>תליון</em> הקשר"),
    line: S("The same mark, hung at the collarbone on a 42 cm chain.", "אותו סמל, נח על עצם הבריח, על שרשרת באורך 42 ס\"מ.") },
  { cat: "earrings",  ref: "SLV·E·001", when: S("Spring", "אביב"),
    name: S("The Knot <em>Earrings</em>", "<em>עגילי</em> הקשר"),
    line: S("Close to the lobe. Nothing swings, nothing catches.", "צמודים לתנוך. שום דבר לא מתנדנד ושום דבר לא נתפס.") },];
/* The Line is not in this list on purpose. It is the only piece in the house
   you build rather than choose, and it has a chapter of its own further down
   the page — carrying it here as well made the catalogue six long and said the
   same thing twice. */
