/* The trust pages.
   ────────────────────────────────────────────────────────────────────────────
   Six documents a house selling at this level is expected to publish, and that
   a reader looks for before they write to a concierge: what happens to what
   they tell you, what they are agreeing to, what the house stands behind, how
   to look after the piece, what proves it is what it says, and how it reaches
   them.

   Written for SILAVU specifically — by appointment, made to order, Dubai and
   Tel Aviv, GIA and IGI — rather than filled with the boilerplate that makes
   these pages worthless. They are short on purpose.

   PROVISIONAL: these are drafted, not cleared. A lawyer in each of the two
   jurisdictions should read them before launch, and the bracketed figures
   (cooling-off, carriage insurer, registered entity) need the real ones. */

const S = (en, he) => ({ en, he });

export const POLICIES = [
  {
    slug: "privacy",
    title: S("Privacy", "פרטיות"),
    lede: S("What you tell the house, and what becomes of it.",
            "מה שאתם מספרים לבית, ומה עולה בגורלו."),
    body: [
      [S("What we hold", "מה אנחנו שומרים"),
       S("Only what you send us: a name, a city, a way to reach you, and what you wrote in the message. Nothing is bought from anyone and nothing is inferred about you. The enquiry form opens your own mail or messaging app — the house receives what you chose to send, from your own address.",
         "רק את מה שאתם שולחים: שם, עיר, דרך ליצור קשר, ומה שכתבתם. שום דבר לא נרכש מאף אחד ושום דבר לא מוסק עליכם. טופס הפנייה פותח את אפליקציית הדואר או ההודעות שלכם — הבית מקבל את מה שבחרתם לשלוח, מהכתובת שלכם.")],
      [S("What the site itself collects", "מה האתר עצמו אוסף"),
       S("No advertising trackers, no third-party analytics, no profile. The site sets no cookie for marketing. Your language choice is kept in your own browser and never leaves it.",
         "אין עוקבי פרסום, אין אנליטיקה של צד שלישי, אין פרופיל. האתר לא מציב עוגייה שיווקית. בחירת השפה נשמרת בדפדפן שלכם ולא עוזבת אותו.")],
      [S("Who sees it", "מי רואה"),
       S("The concierge and the people in the workshop who need it to answer you. Never sold, never shared for anyone else's marketing. A carrier is told a delivery address and nothing else; a laboratory is told a stone, not a client.",
         "הקונסיירז' והאנשים בסדנה שזקוקים לכך כדי לענות לכם. לעולם לא נמכר, לעולם לא משותף לשיווק של אחרים. לשליח נמסרת כתובת מסירה ותו לא; למעבדה נמסרת אבן, לא לקוח.")],
      [S("How long", "לכמה זמן"),
       S("An enquiry that does not become a commission is kept for two years and then deleted. A commission is kept for as long as the piece is under the house's care, because a certificate, a resize and a valuation all need its record.",
         "פנייה שלא הופכת להזמנה נשמרת שנתיים ואז נמחקת. הזמנה נשמרת כל עוד התכשיט בטיפול הבית, כי תעודה, שינוי מידה והערכת שווי — כולם נשענים על הרישום.")],
      [S("Your say", "הזכות שלכם"),
       S("Write to concierge@silavu.com and ask for a copy of what is held, a correction, or its deletion. It is done, and you are told when.",
         "כתבו ל־concierge@silavu.com ובקשו עותק של מה שנשמר, תיקון, או מחיקה. זה נעשה, ונאמר לכם מתי.")]
    ]
  },
  {
    slug: "terms",
    title: S("Terms", "תנאים"),
    lede: S("What is being agreed when a piece is commissioned.",
            "על מה מסכימים כשמזמינים תכשיט."),
    body: [
      [S("Nothing is sold from this site", "שום דבר לא נמכר מהאתר"),
       S("There is no checkout. Every piece is reserved by conversation, confirmed in writing, and priced when its stones are chosen. Anything shown here is an invitation to enquire, not an offer capable of acceptance.",
         "אין קופה. כל תכשיט נשמר בשיחה, מאושר בכתב, ומתומחר כשנבחרות אבניו. כל מה שמוצג כאן הוא הזמנה לפנות, לא הצעה שניתן לקבל.")],
      [S("Figures on this site", "מספרים באתר"),
       S("The configurator gives an indicative estimate. It is not a quotation. The figure is set once the stones are selected and certified and depends on what exists in that grade at the time; currency conversions are indicative and move daily.",
         "התצורה נותנת הערכה ראשונית. היא אינה הצעת מחיר. המספר נקבע לאחר בחירת האבנים והנפקת התעודות ותלוי במה שקיים באותה דרגה באותו מועד; המרות מטבע הן אינדיקטיביות ומשתנות מדי יום.")],
      [S("Commissioning", "הזמנה"),
       S("A commission begins on a written confirmation and a deposit. Because each piece is cut, cast and set for one person, a commission cannot be cancelled once the stones are cut — before that point the deposit is returned in full. [Cooling-off period to be set per jurisdiction.]",
         "הזמנה מתחילה באישור בכתב ובמקדמה. מאחר שכל תכשיט נחתך, נוצק ומשובץ עבור אדם אחד, לא ניתן לבטל הזמנה לאחר שהאבנים נחתכו — עד אותו רגע המקדמה מוחזרת במלואה. [תקופת צינון תיקבע לפי מדינה.]")],
      [S("What the house is", "מיהו הבית"),
       S("SILAVU, Dubai and Tel Aviv, by appointment only. [Registered entity, licence number and registered address to be entered.] These terms are governed by the law of the place the piece is delivered.",
         "סילאבו, דובאי ותל אביב, בתיאום מראש בלבד. [ישות רשומה, מספר רישיון וכתובת רשומה יוזנו.] תנאים אלה כפופים לדין המקום שאליו נמסר התכשיט.")]
    ]
  },
  {
    slug: "warranty",
    title: S("Warranty & Service", "אחריות ושירות"),
    lede: S("What the house stands behind, and for how long.",
            "על מה הבית עומד, ולכמה זמן."),
    body: [
      [S("The making", "העשייה"),
       S("Every piece is guaranteed against fault in its making and its materials for as long as you own it. A setting that loosens, a clasp that tires, a solder that fails — the house repairs it, and it does not charge you for it.",
         "כל תכשיט מובטח מפני פגם בעשייה ובחומרים כל עוד הוא שלכם. שיבוץ שמתרופף, סגר שמתעייף, הלחמה שנכשלת — הבית מתקן, ולא גובה על כך.")],
      [S("What it does not cover", "מה לא נכלל"),
       S("Wear, a knock, a loss, a stone chipped by an impact, or work done by another workshop. Those are repaired too, quoted first and at cost.",
         "בלאי, מכה, אובדן, אבן שנפגמה מפגיעה, או עבודה שנעשתה בסדנה אחרת. גם אלה מתוקנים — בהצעת מחיר מראש, במחיר עלות.")],
      [S("On the house, always", "על חשבון הבית, תמיד"),
       S("Cleaning, polishing, a check of every setting under the loupe, resizing a bracelet or a ring, and a fresh valuation for your insurer. Bring it in or send it; there is no charge and no time limit.",
         "ניקוי, ליטוש, בדיקת כל שיבוץ תחת זכוכית מגדלת, שינוי מידה של צמיד או טבעת, והערכת שווי מעודכנת למבטח שלכם. הביאו או שלחו; אין תשלום ואין מגבלת זמן.")],
      [S("How long it takes", "כמה זמן"),
       S("A service is two weeks in the workshop. A repair is quoted within three days of it arriving. You are told when it is on the bench and when it is finished.",
         "טיפול אורך שבועיים בסדנה. תיקון מתומחר בתוך שלושה ימים מרגע ההגעה. נאמר לכם מתי הוא על השולחן ומתי הסתיים.")]
    ]
  },
  {
    slug: "care",
    title: S("Jewellery Care", "טיפוח התכשיט"),
    lede: S("How to keep it the way it left the bench.",
            "איך לשמור עליו כפי שיצא מהסדנה."),
    body: [
      [S("Every day", "ביום־יום"),
       S("Put it on last and take it off first. Scent, lotion and hairspray dull a polish and settle under a pavé; chlorine and salt water are worse. A piece taken off before a shower will outlast one that is not.",
         "ענדו אחרון, הסירו ראשון. בושם, קרם ותרסיס שיער מעמעמים ליטוש ומצטברים מתחת לפאווה; כלור ומי ים גרועים יותר. תכשיט שמוסר לפני מקלחת יאריך ימים על פני אחד שלא.")],
      [S("Cleaning it yourself", "ניקוי בבית"),
       S("Warm water, a drop of plain soap, a soft brush, two minutes, then dry it properly with a lint-free cloth. Nothing else. No ultrasonic tank at home, no ammonia, no toothpaste — an ultrasonic bath can shift a stone that was perfectly set.",
         "מים פושרים, טיפת סבון רגיל, מברשת רכה, שתי דקות, וייבוש טוב במטלית נטולת סיבים. שום דבר אחר. לא אמבט אולטרסוני בבית, לא אמוניה, לא משחת שיניים — אמבט אולטרסוני יכול להזיז אבן ששובצה היטב.")],
      [S("Keeping it", "אחסון"),
       S("Separately, in the pouch it came in. Diamond is the hardest thing in the box and will scratch everything else in it, including another diamond's girdle.",
         "בנפרד, בשקית שהגיעה איתו. היהלום הוא הקשה בקופסה ויישרוט כל דבר אחר בה, כולל את שולי היהלום השני.")],
      [S("Once a year", "פעם בשנה"),
       S("Send it in. Ten minutes under a loupe finds a claw that has moved before it becomes a stone on a pavement. It costs nothing.",
         "שלחו אותו. עשר דקות תחת זכוכית מגדלת מאתרות ציפורן שזזה לפני שהיא הופכת לאבן על המדרכה. זה לא עולה דבר.")]
    ]
  },
  {
    slug: "authenticity",
    title: S("Authenticity & Certificates", "מקוריות ותעודות"),
    lede: S("What proves the piece is what the house says it is.",
            "מה מוכיח שהתכשיט הוא מה שהבית אומר שהוא."),
    body: [
      [S("Every stone is graded before it is set", "כל אבן מדורגת לפני השיבוץ"),
       S("Independently, by GIA or IGI, and you see the report before the stone goes on the bench. The house does not grade its own stones and does not ask you to take its word for a colour or a clarity.",
         "באופן עצמאי, על ידי GIA או IGI, ואתם רואים את הדוח לפני שהאבן עולה לשולחן. הבית לא מדרג את אבניו ולא מבקש מכם להאמין לו על צבע או ניקיון.")],
      [S("What travels with the piece", "מה נוסע עם התכשיט"),
       S("The laboratory report for the principal stone, a house certificate naming the metal, the total weight, the count and the date it was finished, and a valuation written for an insurer. All three carry your name.",
         "דוח המעבדה לאבן המרכזית, תעודת בית הנוקבת במתכת, במשקל הכולל, בכמות ובתאריך הסיום, והערכת שווי שנכתבה עבור מבטח. שלושתם נושאים את שמכם.")],
      [S("The mark", "הסימון"),
       S("Every piece carries the house mark and its own reference, struck where it can be read. Quote that reference and the house can tell you what it is, when it was made and what is in it.",
         "כל תכשיט נושא את סמל הבית ואת המק\"ט שלו, מוטבעים במקום קריא. מסרו את המק\"ט והבית יוכל לומר לכם מה זה, מתי נעשה ומה יש בו.")],
      [S("Lab-grown is said, not hidden", "מעבדה נאמר, לא מוסתר"),
       S("Where a stone is grown rather than mined it says so on the report, on the house certificate and on the invoice. The house sells both and conceals neither.",
         "כשאבן מגודלת ולא נכרית, כך נאמר בדוח, בתעודת הבית ובחשבונית. הבית מוכר את שניהם ואינו מסתיר אף אחד מהם.")],
      [S("If you are ever unsure", "אם אי פעם יש ספק"),
       S("Send the reference to concierge@silavu.com. The house will confirm, in writing, whether a piece came from it.",
         "שלחו את המק\"ט ל־concierge@silavu.com. הבית יאשר בכתב אם תכשיט יצא ממנו.")]
    ]
  },
  {
    slug: "delivery",
    title: S("Shipping & Delivery", "משלוח ומסירה"),
    lede: S("How a piece reaches you.",
            "איך תכשיט מגיע אליכם."),
    body: [
      [S("By hand, where we can", "ביד, איפה שאפשר"),
       S("In Dubai and in Tel Aviv a piece is brought to you, by appointment, by someone from the house. There is no charge for this and it is the way the house prefers.",
         "בדובאי ובתל אביב תכשיט מובא אליכם, בתיאום מראש, על ידי מישהו מהבית. אין על כך תשלום וזו הדרך שהבית מעדיף.")],
      [S("Everywhere else", "בכל מקום אחר"),
       S("Insured door-to-door carriage for the full value, signature required, tracked from the moment it leaves the workshop. Carriage and insurance are on the house. Duties and import tax at the destination are not, and are yours.",
         "הובלה מבוטחת מדלת לדלת בשווי המלא, בחתימה, במעקב מרגע היציאה מהסדנה. ההובלה והביטוח על חשבון הבית. מכס ומס יבוא ביעד אינם, והם עליכם.")],
      [S("When", "מתי"),
       S("A finished piece leaves within three working days of payment clearing. A commission is four to six weeks from the order, and you are told the week it will be ready as soon as the stones are cut.",
         "תכשיט מוכן יוצא בתוך שלושה ימי עסקים מרגע שהתשלום נקלט. הזמנה אורכת ארבעה עד שישה שבועות מרגע ההזמנה, ונאמר לכם באיזה שבוע היא תהיה מוכנה מיד עם חיתוך האבנים.")],
      [S("If something is wrong on arrival", "אם משהו לא תקין בהגעה"),
       S("Tell the house within forty-eight hours and do not sign for a package whose seal is broken. A piece that arrives damaged is replaced or remade, carried both ways at the house's cost.",
         "הודיעו לבית בתוך ארבעים ושמונה שעות ואל תחתמו על חבילה שחותמה נפרץ. תכשיט שמגיע פגום מוחלף או נעשה מחדש, בהובלה דו־כיוונית על חשבון הבית.")]
    ]
  }
];
