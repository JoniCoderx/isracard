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
    widths: [640, 900, 1254],   /* what your photographs were actually shot at */
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
    /* the three figures that sit above the fold of the piece window */
    key: [
      [S("Metal", "מתכת"),   S("18K white gold", "זהב לבן 18K")],
      [S("Length", "אורך"),  S("16–19 cm", "16–19 ס\"מ")],
      [S("Weight", "משקל"),  S("4.6 g", "4.6 גרם")]
    ],
    story: S("It is the house mark, cast in one piece rather than soldered from two, so the ribbon really does pass through itself and the light runs the whole way round without a seam to stop it. It is small on purpose — twelve millimetres across — because this is the bracelet you forget you are wearing. The chain is rolo, heavy enough to hang straight, and the clasp carries the name on a plaque you can read.",
             "זה סמל הבית, יצוק בחתיכה אחת ולא מולחם משתיים, כך שהסרט באמת עובר דרך עצמו והאור רץ סביבו בלי תפר שיעצור אותו. הוא קטן בכוונה — שנים־עשר מילימטר — כי זה הצמיד ששוכחים שעונדים. השרשרת היא רולו, כבדה מספיק כדי ליפול ישר, והסגר נושא את השם על לוחית שאפשר לקרוא."),
    stones: S("None as standard: this one is about the metal. The centre takes 0.42 ct of E VS pav&eacute; to order, thirty-one stones set by hand, and the certificates travel with it.",
              "ללא אבנים בגרסה הרגילה: כאן הסיפור הוא המתכת. המרכז מקבל 0.42 ct של פאווה E VS לפי הזמנה, שלושים ואחת אבנים משובצות ביד, והתעודות נוסעות איתו."),
    care: S("Four to six weeks from the order, because it is cut, cast and polished for you. Resizing, cleaning and a check of the clasp are on the house, for as long as you own it.",
            "ארבעה עד שישה שבועות מההזמנה, כי הוא נחתך, נוצק ומלוטש בשבילכם. שינוי מידה, ניקוי ובדיקת סגר — על חשבון הבית, כל עוד הוא שלכם."),
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
    widths: [800, 1200, 1600, 2000],
    name: S("The Desert <em>Star</em>", "<em>כוכב</em> המדבר"),
    plain: "The Desert Star",
    line: S("Eighteen carats, D, internally flawless. There is one.",
            "שמונה־עשר קראט, D, ללא רבב פנימי. יש אחת."),
    shots: [
      { img: "star-worn", alt: S("The Desert Star worn at the throat", "כוכב המדבר ענוד על הצוואר") },
      { img: "star",      alt: S("The Desert Star, an eighteen carat brilliant in a radiating halo", "כוכב המדבר, בריליאנט 18 קראט בהילה קורנת") }
    ],
    meta: [S("18.06 ct", "18.06 ct"), S("D · IF", "D · IF"), S("Platinum", "פלטינה"), S("Price on request", "מחיר לפי בקשה")],
    key: [
      [S("Centre stone", "אבן מרכזית"), S("18.06 ct", "18.06 ct")],
      [S("Grade", "דירוג"),             S("D · Internally flawless", "D · ללא רבב פנימי")],
      [S("Metal", "מתכת"),              S("Platinum", "פלטינה")]
    ],
    story: S("Eighteen carats is where a diamond stops being a stone and starts being a decision. This one came out of the rough at D colour and internally flawless, which is roughly one stone in several thousand at this weight, and the house bought it before it had a design. The halo is tapered baguettes, cut to fall away from the centre so nothing competes with it. There is one. There will not be another.",
             "שמונה־עשר קראט הם הנקודה שבה יהלום מפסיק להיות אבן ומתחיל להיות החלטה. זה יצא מהרַף בצבע D וללא רבב פנימי, בערך אבן אחת מכמה אלפים במשקל הזה, והבית קנה אותה לפני שהיה עיצוב. ההילה היא בגטים מתחדדים, מלוטשים כך שייפלו מהמרכז ולא יתחרו בו. יש אחת. לא תהיה עוד."),
    stones: S("One 18.06 ct round brilliant, D colour, internally flawless, with its GIA report. Forty-two tapered baguettes around it, F–G VS, matched for length within a tenth of a millimetre.",
              "בריליאנט עגול אחד של 18.06 ct, צבע D, ללא רבב פנימי, עם תעודת GIA שלו. ארבעים ושניים בגטים מתחדדים סביבו, F–G VS, מותאמים באורך בדיוק של עשירית מילימטר."),
    care: S("It exists. A private viewing in Dubai or Tel Aviv, and it travels to you with a courier and an appraiser, not in a parcel.",
            "הוא קיים. פגישה פרטית בדובאי או בתל אביב, והוא מגיע אליכם עם שליח ושמאי, לא בחבילה."),
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
  { cat: "necklaces", ref: "SLV·N·002", when: S("Spring", "אביב"),
    name: S("The Knot <em>Pendant</em>", "<em>תליון</em> הקשר"),
    line: S("The same mark, hung at the collarbone on a 42 cm chain.", "אותו סמל, תלוי בעצם הבריח על שרשרת 42 ס\"מ.") },
  { cat: "earrings",  ref: "SLV·E·001", when: S("Spring", "אביב"),
    name: S("The Knot <em>Earrings</em>", "<em>עגילי</em> הקשר"),
    line: S("Close to the lobe. Nothing swings, nothing catches.", "צמודים לתנוך. שום דבר לא מתנדנד, שום דבר לא נתפס.") },
  { cat: "rings",     ref: "SLV·R·001", when: S("Summer", "קיץ"),
    name: S("The Knot <em>Ring</em>", "<em>טבעת</em> הקשר"),
    line: S("A band that ties itself, sized to the half.", "טבעת שנקשרת בעצמה, במידות של חצי.") },
  { cat: "tennis",    ref: "SLV·T·001", when: S("Summer", "קיץ"),
    name: S("The <em>Line</em>", "<em>הקו</em>"),
    line: S("Thirty-six brilliants, one row, built to your wrist.", "שלושים ושישה בריליאנטים, שורה אחת, בנויה לפרק היד שלכם.") }
];
