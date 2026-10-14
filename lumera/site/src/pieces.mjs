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
  { id: "all",       en: "All",        he: "הכול" },
  { id: "bracelets", en: "Bracelets",  he: "צמידים" },
  { id: "necklaces", en: "Necklaces",  he: "שרשראות" },
  { id: "earrings",  en: "Earrings",   he: "עגילים" },
  { id: "rings",     en: "Rings",      he: "טבעות" }
];

const S = (en, he) => ({ en, he });

export const PIECES = [
  {
    /* SILAVU MOMENT. The figures below are the ones the house has confirmed:
       metal, finish, length, price on request. Nothing else is stated. */
    id: "knot", film: { src: "v/moment-film", poster: "img/moment-film-poster.jpg", alt: S("The SILAVU MOMENT bracelet on black: out of the dark, over a black mirror, on black satin", "צמיד SILAVU MOMENT על שחור: מתוך החושך, מעל מראה שחורה, על סאטן שחור") }, seo: S("SILAVU MOMENT Bracelet · 18K White Gold Signature Chain Bracelet", "צמיד SILAVU MOMENT · צמיד שרשרת מזהב לבן 18K"), sub: S("18K white gold signature chain bracelet", "צמיד שרשרת עם חתימה, זהב לבן 18K"), cat: "bracelets", ref: "SLV·B·001", light: true,   /* shot on white */
    widths: [640, 900, 1254],   /* what your photographs were actually shot at */
    theme: "moment", word: "MOMENT",
    title: S("SILAVU MOMENT | White Gold Bracelet", "SILAVU MOMENT | צמיד זהב לבן"),
    name: S("SILAVU <em>MOMENT</em>", "SILAVU <em>MOMENT</em>"),
    kind: S("Bracelet", "צמיד"),
    plain: "SILAVU MOMENT Bracelet", plainHe: "צמיד SILAVU MOMENT",
    line: S("A delicate 18k white-gold chain, finished with the SILAVU signature in a polished sculptural form.",
            "שרשרת עדינה מזהב לבן 18K, עם חתימת SILAVU בצורה פיסולית ומלוטשת."),
    shots: [
      { img: "knot-flat",  alt: S("The SILAVU MOMENT bracelet laid open, the SILAVU signature at its centre", "צמיד SILAVU MOMENT פרוש, חתימת SILAVU במרכזו") },
      { img: "knot-worn",  alt: S("SILAVU MOMENT bracelets layered on a wrist", "צמידי SILAVU MOMENT בשכבות על פרק היד") },
      { img: "knot-macro", alt: S("The polished SILAVU signature of the MOMENT bracelet, close", "חתימת SILAVU המלוטשת של צמיד MOMENT, מקרוב") },
      { img: "knot-clasp", alt: S("The clasp and the engraved SILAVU plaque", "הסגר והלוחית החרוטה של SILAVU") },
      { img: "knot-full",  alt: S("The SILAVU MOMENT bracelet, full length, on white", "צמיד SILAVU MOMENT במלואו, על רקע לבן") }
    ],
    /* the four figures the card shows under the name */
    meta: [S("18K white gold", "זהב לבן 18K"), S("16–19 cm", "16–19 ס\"מ"), S("Polished", "מלוטש"), S("Price on request", "מחיר לפי בקשה")],
    /* the three figures that sit above the fold of the piece window */
    key: [
      [S("Material", "חומר"),          S("18K white gold, polished", "זהב לבן 18K, מלוטש")],
      [S("Diamonds", "יהלומים"),       S("None. The signature is polished metal", "ללא. החתימה עשויה מתכת מלוטשת")],
      [S("Dimensions", "מידות"),       S("16–19 cm", "16–19 ס\"מ")],
      [S("Availability", "זמינות"),    S("Made to order", "מיוצר לפי הזמנה")]
    ],
    stonesInside: false,
    story: S("Designed as an everyday signature, MOMENT places the SILAVU mark on a fine white-gold chain. Its polished form catches the light with every movement: delicate when worn alone, and beautiful layered with other pieces. A quiet detail that becomes part of your everyday look.",
             "\u200fMOMENT נוצר כחתימה יומיומית: סמל SILAVU על שרשרת עדינה מזהב לבן. הצורה המלוטשת שלו תופסת את האור בכל תנועה. הוא עדין כשהוא ענוד לבד, ויפה בשכבות עם תכשיטים אחרים. פרט שקט שהופך לחלק מהמראה היומיומי שלכם."),
    specs: [
      [S("Reference", "מק\"ט"),  S("SLV·B·001", "SLV·B·001")],
      [S("Metal", "מתכת"),       S("18K white gold", "זהב לבן 18K")],
      [S("Finish", "גימור"),     S("Polished", "מלוטש")],
      [S("Length", "אורך"),      S("16–19 cm", "16–19 ס\"מ")],
      [S("Price", "מחיר"),       S("Price on request", "מחיר לפי בקשה")]
    ],
    reserve: true
  }  ,{
    /* SILAVU ICON: metal, setting and sizes as confirmed; no stone figures */
    id: "ring", film: { src: "v/icon-film", poster: "img/icon-film-poster.jpg", alt: S("The SILAVU ICON ring on black: out of the dark, over a black mirror, on black satin", "טבעת SILAVU ICON על שחור: מתוך החושך, מעל מראה שחורה, על סאטן שחור") }, seo: S("SILAVU ICON Ring · 18K White Gold Pavé Diamond Signature Ring", "טבעת SILAVU ICON · טבעת יהלומי פאווה מזהב לבן 18K"), sub: S("18K white gold ring, pavé diamond signature", "טבעת זהב לבן 18K, חתימה ביהלומי פאווה"), cat: "rings", ref: "SLV·R·001", light: true,   /* shot on white */
    widths: [640, 900, 1254],
    theme: "icon", word: "ICON",
    title: S("SILAVU ICON | Diamond Ring", "SILAVU ICON | טבעת יהלומים"),
    name: S("SILAVU <em>ICON</em>", "SILAVU <em>ICON</em>"),
    kind: S("Ring", "טבעת"),
    plain: "SILAVU ICON Ring", plainHe: "טבעת SILAVU ICON",
    line: S("A sculptural 18k white-gold ring with the SILAVU signature set in pavé diamonds.",
            "טבעת פיסולית מזהב לבן 18K, עם חתימת SILAVU משובצת ביהלומי פאווה."),
    /* the gallery runs the way a jewellery house runs one: the piece on white,
       then worn, then the angle, then the mark close, then the signature */
    shots: [
      { img: "ring-front",  alt: S("The SILAVU ICON ring, the SILAVU signature in pavé diamonds", "טבעת SILAVU ICON, חתימת SILAVU ביהלומי פאווה") },
      { img: "ring-worn",   alt: S("The SILAVU ICON ring worn on the hand", "טבעת SILAVU ICON ענודה על היד") },
      { img: "ring-side",   alt: S("The SILAVU ICON ring from three quarters", "טבעת SILAVU ICON בזווית שלושת־רבעי") },
      { img: "ring-macro",  alt: S("The pavé SILAVU signature of the ICON ring, close", "חתימת הפאווה של טבעת ICON, מקרוב") },
      { img: "ring-signed", alt: S("SILAVU engraved inside the band of the ICON ring", "SILAVU חרוט בתוך טבעת ICON") }
    ],
    meta: [S("18K white gold", "זהב לבן 18K"), S("EU 47–58", "EU 47–58"), S("Pavé", "פאווה"), S("Price on request", "מחיר לפי בקשה")],
    key: [
      [S("Material", "חומר"),          S("18K white gold", "זהב לבן 18K")],
      [S("Diamonds", "יהלומים"),       S("Pavé, across the signature and the band", "פאווה, לאורך החתימה והטבעת")],
      [S("Dimensions", "מידות"),       S("EU sizes 47–58", "מידות EU 47–58")],
      [S("Availability", "זמינות"),    S("Made to order", "מיוצר לפי הזמנה")]
    ],
    stonesInside: true,
    story: S("ICON turns the SILAVU mark into a sculptural ring, traced with pavé diamonds across its flowing form and band. The design balances a bold silhouette with fine detail, letting the diamonds catch the light from every angle.",
             "\u200fICON הופכת את סמל SILAVU לטבעת פיסולית, עם יהלומי פאווה לאורך הצורה הזורמת שלה ולאורך הטבעת עצמה. העיצוב מאזן בין צללית נועזת לפרטים עדינים, ומאפשר ליהלומים לתפוס את האור מכל זווית."),
    specs: [
      [S("Reference", "מק\"ט"),  S("SLV·R·001", "SLV·R·001")],
      [S("Metal", "מתכת"),       S("18K white gold", "זהב לבן 18K")],
      [S("Setting", "שיבוץ"),    S("Pavé", "פאווה")],
      [S("Size", "מידה"),        S("EU 47–58", "EU 47–58")],
      [S("Price", "מחיר"),       S("Price on request", "מחיר לפי בקשה")]
    ],
    reserve: true
  }  ,{
    /* SILAVU SOUL: metal, setting and length as confirmed; no stone figures */
    id: "pave", film: { src: "v/soul-film", poster: "img/soul-film-poster.jpg", alt: S("The SILAVU SOUL necklace on black: out of the dark, over a black mirror, on black satin", "שרשרת SILAVU SOUL על שחור: מתוך החושך, מעל מראה שחורה, על סאטן שחור") }, seo: S("SILAVU SOUL Necklace · 18K White Gold Pavé Diamond Pendant", "שרשרת SILAVU SOUL · תליון יהלומי פאווה מזהב לבן 18K"), sub: S("18K white gold necklace, pavé diamond signature pendant", "שרשרת זהב לבן 18K, תליון חתימה ביהלומי פאווה"), cat: "necklaces", ref: "SLV·N·003", light: true,   /* shot on white */
    widths: [640, 900, 1254],
    theme: "soul", word: "SOUL",
    title: S("SILAVU SOUL | Diamond Necklace", "SILAVU SOUL | שרשרת יהלומים"),
    name: S("SILAVU <em>SOUL</em>", "SILAVU <em>SOUL</em>"),
    kind: S("Necklace", "שרשרת"),
    plain: "SILAVU SOUL Necklace", plainHe: "שרשרת SILAVU SOUL",
    line: S("A fine 18k white-gold chain with a pavé SILAVU signature pendant at its center.",
            "שרשרת עדינה מזהב לבן 18K, ובמרכזה תליון חתימת SILAVU בשיבוץ פאווה."),
    shots: [
      { img: "necklace-front",  alt: S("The SILAVU SOUL necklace, full length", "שרשרת SILAVU SOUL, במלואה") },
      { img: "necklace-worn",   alt: S("The SILAVU SOUL necklace worn at the collarbone", "שרשרת SILAVU SOUL ענודה על עצם הבריח") },
      { img: "necklace-detail", alt: S("The SOUL pendant and the chain either side of it", "תליון SOUL והשרשרת משני צדיו") },
      { img: "necklace-macro",  alt: S("The pavé SILAVU signature of the SOUL pendant, close", "חתימת הפאווה של תליון SOUL, מקרוב") }
    ],
    meta: [S("18K white gold", "זהב לבן 18K"), S("42 cm", "42 ס\"מ"), S("Pavé", "פאווה"), S("Price on request", "מחיר לפי בקשה")],
    key: [
      [S("Material", "חומר"),          S("18K white gold", "זהב לבן 18K")],
      [S("Diamonds", "יהלומים"),       S("Pavé signature, diamond accents along the chain", "חתימה בשיבוץ פאווה, נגיעות יהלומים לאורך השרשרת")],
      [S("Dimensions", "מידות"),       S("42 cm", "42 ס\"מ")],
      [S("Availability", "זמינות"),    S("Made to order", "מיוצר לפי הזמנה")]
    ],
    stonesInside: true,
    story: S("SOUL brings the SILAVU mark close, set in pavé diamonds at the center of a fine white-gold chain. Delicate diamond accents add points of light along the necklace, creating a piece that feels personal on its own and layers naturally with others.",
             "\u200fSOUL מקרבת אליכם את סמל SILAVU, משובץ ביהלומי פאווה במרכזה של שרשרת עדינה מזהב לבן. נגיעות יהלומים עדינות מוסיפות נקודות אור לאורך השרשרת. זהו תכשיט שמרגיש אישי כשהוא נענד לבד, ומשתלב בטבעיות עם תכשיטים אחרים."),
    specs: [
      [S("Reference", "מק\"ט"),  S("SLV·N·003", "SLV·N·003")],
      [S("Metal", "מתכת"),       S("18K white gold", "זהב לבן 18K")],
      [S("Setting", "שיבוץ"),    S("Pavé", "פאווה")],
      [S("Length", "אורך"),      S("42 cm", "42 ס\"מ")],
      [S("Price", "מחיר"),       S("Price on request", "מחיר לפי בקשה")]
    ],
    reserve: true
  }  ,{
    /* SILAVU AURA, the earrings of the Signature: the owner's photographs
       show the SILAVU mark as a stud, pavé on the loop, the band and the
       teardrop, polished open loops either side, a butterfly back, SILAVU
       engraved behind. Metal and setting follow the house (18K white gold,
       pavé, as ICON and SOUL). AURA, the light around the face, replaced the
       working name ECHO, which the owner did not like. */
    id: "aura", theme: "aura", word: "AURA", cat: "earrings", ref: "SLV·E·001", light: true,   /* shot on white */
    widths: [640, 900, 1254],
    seo: S("SILAVU AURA Earrings · 18K White Gold Pavé Diamond Signature Studs", "עגילי SILAVU AURA · עגילי צמוד מזהב לבן 18K עם חתימה ביהלומי פאווה"),
    sub: S("18K white gold stud earrings, pavé diamond signature", "עגילים צמודים מזהב לבן 18K, חתימה ביהלומי פאווה"),
    title: S("SILAVU AURA | Diamond Earrings", "SILAVU AURA | עגילי יהלומים"),
    name: S("SILAVU <em>AURA</em>", "SILAVU <em>AURA</em>"),
    kind: S("Earrings", "עגילים"),
    plain: "SILAVU AURA Earrings", plainHe: "עגילי SILAVU AURA",
    line: S("The SILAVU signature as a pair of 18k white-gold studs, traced in pavé diamonds.",
            "חתימת SILAVU כזוג עגילים צמודים מזהב לבן 18K, משובצת ביהלומי פאווה."),
    shots: [
      { img: "aura-pair",   alt: S("The SILAVU AURA earrings, a pair of pavé SILAVU signatures", "עגילי SILAVU AURA, זוג חתימות SILAVU בשיבוץ פאווה") },
      { img: "aura-side",   alt: S("One SILAVU AURA earring from three quarters, the butterfly back behind it", "עגיל SILAVU AURA בזווית שלושת־רבעי, הסגר מאחוריו") },
      { img: "aura-worn",   alt: S("The SILAVU AURA earring worn", "עגיל SILAVU AURA ענוד") },
      { img: "aura-macro",  alt: S("The pavé of the AURA earring, close", "שיבוץ הפאווה של עגיל AURA, מקרוב") },
      { img: "aura-signed", alt: S("SILAVU engraved on the back of the AURA earrings", "SILAVU חרוט בגב עגילי AURA") }
    ],
    meta: [S("18K white gold", "זהב לבן 18K"), S("Studs", "צמודים"), S("Pavé", "פאווה"), S("Price on request", "מחיר לפי בקשה")],
    key: [
      [S("Material", "חומר"),          S("18K white gold", "זהב לבן 18K")],
      [S("Diamonds", "יהלומים"),       S("Pavé, along the signature", "פאווה, לאורך החתימה")],
      [S("Fastening", "סגירה"),        S("Stud with butterfly back", "צמוד עם סגר פרפר")],
      [S("Availability", "זמינות"),    S("Made to order", "מיוצר לפי הזמנה")]
    ],
    stonesInside: true,
    story: S("AURA brings the SILAVU mark to the ear, close to the face: pavé diamonds along its loop, its band and its teardrop, with polished open loops either side. SILAVU is engraved on the back of each one.",
             "\u200fAURA מביאה את סמל SILAVU אל האוזן, קרוב לפנים: יהלומי פאווה לאורך הלולאה, הפס והטיפה, ולולאות פתוחות מלוטשות משני הצדדים. SILAVU חרוט בגב כל אחד מהם."),
    specs: [
      [S("Reference", "מק\"ט"),  S("SLV·E·001", "SLV·E·001")],
      [S("Metal", "מתכת"),       S("18K white gold", "זהב לבן 18K")],
      [S("Setting", "שיבוץ"),    S("Pavé", "פאווה")],
      [S("Fastening", "סגירה"),  S("Butterfly back", "סגר פרפר")],
      [S("Price", "מחיר"),       S("Price on request", "מחיר לפי בקשה")]
    ],
    reserve: true
  }  ,{
    /* SILAVU PROMISE: the name confirmed by the owner, who asked for the
       karat and the sizes to follow the house (18K, as every piece; EU 47–58,
       as ICON). The rest is what the owner's photographs show: a sculpted
       band that folds open over one baguette diamond, SILAVU engraved inside.
       Last in the collection, as the owner asked. */
    id: "promise", theme: "promise", word: "PROMISE", group: "special", cat: "rings",   /* a special piece, not of the signature line */ ref: "SLV·R·002", light: true,   /* shot on white */
    widths: [640, 900, 1254],
    seo: S("SILAVU PROMISE Ring · 18K Yellow Gold Baguette Diamond Engagement Ring", "טבעת SILAVU PROMISE · טבעת אירוסין מזהב צהוב 18K עם יהלום בגט"),
    sub: S("18K yellow gold engagement ring, one baguette diamond", "טבעת אירוסין מזהב צהוב 18K, יהלום בגט אחד"),
    title: S("SILAVU PROMISE | Engagement Ring", "SILAVU PROMISE | טבעת אירוסין"),
    name: S("SILAVU <em>PROMISE</em>", "SILAVU <em>PROMISE</em>"),
    kind: S("Engagement ring", "טבעת אירוסין"),
    plain: "SILAVU PROMISE Ring", plainHe: "טבעת SILAVU PROMISE",
    line: S("A sculpted 18k yellow-gold band that folds open along its crown to hold a single baguette diamond.",
            "טבעת פיסולית מזהב צהוב 18K, שנפתחת לאורך הכתר שלה ומחזיקה יהלום בגט יחיד."),
    shots: [
      { img: "promise-front",  alt: S("The SILAVU PROMISE ring, a baguette diamond set in the fold of a yellow-gold band", "טבעת SILAVU PROMISE, יהלום בגט משובץ בקפל של טבעת זהב צהוב") },
      { img: "promise-macro",  alt: S("The baguette diamond in the fold of the PROMISE ring, close", "יהלום הבגט בקפל של טבעת PROMISE, מקרוב") },
      { img: "promise-signed", alt: S("SILAVU engraved inside the band of the PROMISE ring", "SILAVU חרוט בתוך טבעת PROMISE") }
    ],
    meta: [S("18K yellow gold", "זהב צהוב 18K"), S("EU 47–58", "EU 47–58"), S("Baguette diamond", "יהלום בגט"), S("Price on request", "מחיר לפי בקשה")],
    key: [
      [S("Material", "חומר"),          S("18K yellow gold, polished", "זהב צהוב 18K, מלוטש")],
      [S("Diamonds", "יהלומים"),       S("One baguette-cut diamond", "יהלום אחד בחיתוך בגט")],
      [S("Dimensions", "מידות"),       S("EU sizes 47–58", "מידות EU 47–58")],
      [S("Availability", "זמינות"),    S("Made to order", "מיוצר לפי הזמנה")]
    ],
    stonesInside: true,
    story: S("PROMISE is a band that opens. Its polished 18k yellow gold folds back along the crown, and in the opening sits a single baguette diamond, held by the metal itself. SILAVU is engraved inside the band.",
             "\u200fPROMISE היא טבעת שנפתחת. הזהב הצהוב 18K המלוטש מתקפל לאורך הכתר, ובפתח יושב יהלום בגט יחיד, מוחזק בידי המתכת עצמה. SILAVU חרוט בתוך הטבעת."),
    specs: [
      [S("Reference", "מק\"ט"),  S("SLV·R·002", "SLV·R·002")],
      [S("Metal", "מתכת"),       S("18K yellow gold", "זהב צהוב 18K")],
      [S("Stone", "אבן"),        S("One baguette diamond", "יהלום בגט אחד")],
      [S("Finish", "גימור"),     S("Polished", "מלוטש")],
      [S("Size", "מידה"),        S("EU 47–58", "EU 47–58")],
      [S("Price", "מחיר"),       S("Price on request", "מחיר לפי בקשה")]
    ],
    reserve: true
  }  ,{
    /* SILAVU BLUSH, a special piece (the owner, 14 Oct): the photographs
       show an eternity band of radiant-cut pink sapphires all the way
       round (named by the owner), four claws each, white diamond pavé along
       both edges. Metal and sizes follow the house (18K rose gold, EU 47–58). */
    id: "blush", theme: "blush", word: "BLUSH", group: "special", cat: "rings", ref: "SLV·R·003", light: true,   /* shot on white */
    widths: [640, 900, 1254],
    seo: S("SILAVU BLUSH Ring · 18K Rose Gold Pink Sapphire Eternity Band", "טבעת SILAVU BLUSH · טבעת נצח מזהב ורוד 18K עם ספירים ורודים"),
    sub: S("18K rose gold eternity band, pink sapphires and diamond pavé", "טבעת נצח מזהב ורוד 18K, ספירים ורודים ושיבוץ יהלומי פאווה"),
    title: S("SILAVU BLUSH | Eternity Ring", "SILAVU BLUSH | טבעת נצח"),
    name: S("SILAVU <em>BLUSH</em>", "SILAVU <em>BLUSH</em>"),
    kind: S("Eternity ring", "טבעת נצח"),
    plain: "SILAVU BLUSH Ring", plainHe: "טבעת SILAVU BLUSH",
    line: S("An 18k rose-gold eternity band of radiant-cut pink sapphires, edged on both sides in diamond pavé.",
            "טבעת נצח מזהב ורוד 18K של ספירים ורודים בחיתוך רדיאנט, ומשני צדיה שיבוץ יהלומי פאווה."),
    shots: [
      { img: "blush-front",   alt: S("The SILAVU BLUSH ring, pink radiant-cut sapphires all the way round a rose-gold band", "טבעת SILAVU BLUSH, ספירים ורודים בחיתוך רדיאנט לכל אורך טבעת מזהב ורוד") },
      { img: "blush-macro",   alt: S("The pink sapphires and the diamond pavé of the BLUSH ring, close", "הספירים הוורודים ויהלומי הפאווה של טבעת BLUSH, מקרוב") },
      { img: "blush-worn",    alt: S("The SILAVU BLUSH ring worn on the hand", "טבעת SILAVU BLUSH ענודה על היד") },
      { img: "blush-side",    alt: S("The SILAVU BLUSH ring from three quarters", "טבעת SILAVU BLUSH בזווית שלושת־רבעי") },
      { img: "blush-profile", alt: S("The SILAVU BLUSH ring seen edge on, the pavé inside the circle", "טבעת SILAVU BLUSH מהצד, הפאווה בתוך המעגל") }
    ],
    meta: [S("18K rose gold", "זהב ורוד 18K"), S("EU 47–58", "EU 47–58"), S("Eternity", "נצח"), S("Price on request", "מחיר לפי בקשה")],
    key: [
      [S("Material", "חומר"),          S("18K rose gold", "זהב ורוד 18K")],
      [S("Stones", "אבנים"),           S("Radiant-cut pink sapphires all the way round, diamond pavé on both edges", "ספירים ורודים בחיתוך רדיאנט לכל אורך הטבעת, יהלומי פאווה משני הצדדים")],
      [S("Dimensions", "מידות"),       S("EU sizes 47–58", "מידות EU 47–58")],
      [S("Availability", "זמינות"),    S("Made to order", "מיוצר לפי הזמנה")]
    ],
    stonesInside: true,
    story: S("BLUSH is colour all the way round: radiant-cut pink sapphires held on four claws each, without a break, and a fine line of white diamond pavé along both edges, all in 18k rose gold.",
             "\u200fBLUSH היא צבע לכל אורך הטבעת: ספירים ורודים בחיתוך רדיאנט, כל אחד על ארבע שיניים, בלי הפסקה, וקו עדין של יהלומי פאווה לבנים לאורך שני הצדדים, הכול בזהב ורוד 18K."),
    specs: [
      [S("Reference", "מק\"ט"),  S("SLV·R·003", "SLV·R·003")],
      [S("Metal", "מתכת"),       S("18K rose gold", "זהב ורוד 18K")],
      [S("Stones", "אבנים"),     S("Radiant-cut pink sapphires, diamond pavé", "ספירים ורודים בחיתוך רדיאנט, יהלומי פאווה")],
      [S("Size", "מידה"),        S("EU 47–58", "EU 47–58")],
      [S("Price", "מחיר"),       S("Price on request", "מחיר לפי בקשה")]
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
             "בשמונה־עשר קראט יהלום מפסיק להיות אבן והופך להחלטה. האבן הזו יצאה מהגלם בצבע D וללא פגמים פנימיים, בערך אחת מכמה אלפים במשקל הזה, והבית רכש אותה עוד לפני שנולד העיצוב. ההילה עשויה בגטים מתחדדים, מלוטשים כך שיובילו את העין אל המרכז ולא יתחרו בו. יש רק אחת, ולא תהיה נוספת."),
    stones: S("One 18.06 ct round brilliant, D colour, internally flawless, with its GIA report. Forty-two tapered baguettes around it, F–G VS, matched for length within a tenth of a millimetre.",
              "בריליאנט עגול אחד במשקל 18.06 ct, צבע D, ללא פגמים פנימיים, עם תעודת GIA משלו. סביבו ארבעים ושניים בגטים מתחדדים בדרגת F–G VS, מותאמים באורכם בדיוק של עשירית מילימטר."),
    care: S("It exists. A private viewing in Dubai or Tel Aviv, and it travels to you with a courier and an appraiser, not in a parcel.",
            "התכשיט קיים ומוכן. הצפייה בפגישה פרטית בדובאי או בתל אביב, והמסירה על ידי שליח ושמאי, ולא בחבילה."),
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

/* What is still to come is shown as one quiet line, "Coming soon", and
   nothing more: no names and no descriptions for pieces that are not yet
   photographed or confirmed. It stands under "All" and under any category
   that has no finished piece yet, so a filter never opens onto nothing. */
export const SOON = [];
/* The Line is not in this list on purpose. It is the only piece in the house
   you build rather than choose, and it has a chapter of its own further down
   the page — carrying it here as well made the catalogue six long and said the
   same thing twice. */
