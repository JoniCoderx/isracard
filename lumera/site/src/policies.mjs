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

   They carry no placeholders: where a fact is not yet fixed (the contracting
   company and its registration) the page says where the reader will find it
   rather than inventing it. A lawyer in each jurisdiction should still read
   them before launch. */

const S = (en, he) => ({ en, he });

export const POLICIES = [
  {
    slug: "privacy",
    title: S("Privacy", "פרטיות"),
    lede: S("What you tell the house, and what becomes of it.",
            "מה אתם מוסרים לנו, ומה נעשה במידע."),
    body: [
      [S("What we hold", "המידע שנשמר"),
       S("Only what you send us: a name, a city, a way to reach you, and what you wrote in the message. Nothing is bought from anyone and nothing is inferred about you. The enquiry form opens your own mail or messaging app, so the house receives what you chose to send, from your own address.",
         "רק מה שאתם שולחים: שם, עיר, פרטי התקשרות ותוכן ההודעה. איננו רוכשים מידע מגורמים אחרים ואיננו מסיקים עליכם דבר. טופס הפנייה פותח את אפליקציית הדואר או ההודעות שלכם, כך שאנו מקבלים רק את מה שבחרתם לשלוח, מהכתובת שלכם.")],
      [S("What the site itself collects", "מה האתר אוסף"),
       S("No advertising trackers, no third-party analytics, no profile. The site sets no cookie for marketing. Your language choice is kept in your own browser and never leaves it.",
         "אין באתר רכיבי מעקב פרסומיים, אין כלי ניתוח של צד שלישי ואין פרופיל משתמש. האתר אינו שומר עוגיות שיווקיות. בחירת השפה נשמרת בדפדפן שלכם בלבד.")],
      [S("Who sees it", "מי נחשף למידע"),
       S("The concierge and the people in the workshop who need it to answer you. Never sold, never shared for anyone else's marketing. A carrier is told a delivery address and nothing else; a laboratory is told a stone, not a client.",
         "צוות הקונסיירז' ואנשי הסדנה שזקוקים לו כדי לטפל בפנייתכם. המידע אינו נמכר ואינו מועבר לשיווק של גורמים אחרים. חברת השילוח מקבלת כתובת למסירה בלבד, והמעבדה מקבלת את האבן, לא את פרטיכם.")],
      [S("How long", "משך השמירה"),
       S("An enquiry that does not become a commission is kept for two years and then deleted. A commission is kept for as long as the piece is under the house's care, because a certificate, a resize and a valuation all need its record.",
         "פנייה שלא הבשילה להזמנה נשמרת שנתיים ואז נמחקת. פרטי הזמנה נשמרים כל עוד התכשיט בטיפולנו, משום שהנפקת תעודה, שינוי מידה והערכת שווי מסתמכים עליהם.")],
      [S("Your rights", "הזכויות שלכם"),
       S("Write to concierge@silavu.com and ask for a copy of what is held, a correction, or its deletion. It is done, and you are told when.",
         "כתבו אל concierge@silavu.com ובקשו לעיין במידע השמור, לתקן אותו או למחוק אותו. הבקשה תטופל, ונעדכן אתכם כשהיא הושלמה.")]
    ]
  },
  {
    slug: "terms",
    title: S("Terms", "תנאים"),
    lede: S("What is being agreed when a piece is commissioned.",
            "על מה מסכימים בעת הזמנת תכשיט."),
    body: [
      [S("Nothing is sold from this site", "האתר אינו חנות"),
       S("There is no checkout. Every piece is reserved by conversation, confirmed in writing, and priced when its stones are chosen. Anything shown here is an invitation to enquire, not an offer capable of acceptance.",
         "אין באתר רכישה מקוונת. כל תכשיט נשמר בשיחה אישית, מאושר בכתב ומתומחר לאחר בחירת האבנים. כל המוצג באתר הוא הזמנה לפנות אלינו, ואינו הצעה מחייבת.")],
      [S("Figures on this site", "המחירים באתר"),
       S("The configurator gives an indicative estimate. It is not a quotation. The figure is set once the stones are selected and certified and depends on what exists in that grade at the time; currency conversions are indicative and move daily.",
         "כלי העיצוב מציג הערכה ראשונית בלבד ואינו הצעת מחיר. המחיר הסופי נקבע לאחר בחירת האבנים והנפקת התעודות, ותלוי בזמינות אבנים באותה דרגה באותה עת. המרות המטבע משוערות ומשתנות מדי יום.")],
      [S("Commissioning", "ביצוע הזמנה"),
       S("A commission begins on a written confirmation and a deposit. Because each piece is cast and set for one person, a commission cannot be cancelled once its stones are bought and its metal is cast. Before that point the deposit is returned in full. Nothing here limits the rights the consumer law of your country gives you.",
         "הזמנה נכנסת לתוקף עם אישור בכתב ותשלום מקדמה. מאחר שכל תכשיט נוצק ומשובץ עבור לקוח אחד, לא ניתן לבטל הזמנה לאחר רכישת האבנים ויציקת המתכת. עד אז המקדמה מוחזרת במלואה. אין באמור כדי לגרוע מזכויותיכם לפי דיני הגנת הצרכן במדינתכם.")],
      [S("What the house is", "מי אנחנו"),
       S("SILAVU, Dubai and Tel Aviv, by appointment only. The company you contract with, its registration and its address are named on your written confirmation and on the invoice. These terms are governed by the law of the place the piece is delivered.",
         "\u200fSILAVU, דובאי ותל אביב, בתיאום מראש בלבד. שם החברה שעמה נחתמת העסקה, מספר הרישום שלה וכתובתה מופיעים באישור ההזמנה ובחשבונית. על תנאים אלה חל הדין של המקום שבו נמסר התכשיט.")]
    ]
  },
  {
    slug: "warranty",
    title: S("Warranty & Service", "אחריות ושירות"),
    lede: S("What the house stands behind, and for how long.",
            "מה מכוסה באחריות, ולכמה זמן."),
    body: [
      [S("The making", "איכות הייצור"),
       S("Every piece is guaranteed against fault in its making and its materials for as long as you own it. A setting that loosens, a clasp that tires, a solder that fails: the house repairs it, and it does not charge you for it.",
         "כל תכשיט מכוסה באחריות לפגמי ייצור וחומר כל עוד הוא בבעלותכם. שיבוץ שהתרופף, סגר שנחלש או הלחמה שנפגעה יתוקנו ללא תשלום.")],
      [S("What it does not cover", "מה אינו מכוסה"),
       S("Wear, a knock, a loss, a stone chipped by an impact, or work done by another workshop. Those are repaired too, quoted first and at cost.",
         "בלאי טבעי, מכה, אובדן, אבן שנסדקה מפגיעה, או עבודה שבוצעה בסדנה אחרת. גם אלה יתוקנו, לאחר הצעת מחיר מראש, במחיר עלות.")],
      [S("On the house, always", "שירות ללא תשלום, תמיד"),
       S("Cleaning, polishing, a check of every setting under the loupe, resizing a bracelet or a ring, and a fresh valuation for your insurer. Bring it in or send it; there is no charge and no time limit.",
         "ניקוי, ליטוש, בדיקת כל שיבוץ בזכוכית מגדלת, שינוי מידה של צמיד או טבעת והערכת שווי מעודכנת לחברת הביטוח. אפשר להביא או לשלוח, ללא עלות וללא הגבלת זמן.")],
      [S("How long it takes", "זמני טיפול"),
       S("A service is two weeks in the workshop. A repair is quoted within three days of it arriving. You are told when it is on the bench and when it is finished.",
         "טיפול שוטף אורך כשבועיים בסדנה. הצעת מחיר לתיקון תישלח תוך שלושה ימים מקבלת התכשיט. נעדכן אתכם כשהעבודה מתחילה וכשהיא מסתיימת.")]
    ]
  },
  {
    slug: "care",
    title: S("Jewellery Care", "טיפול בתכשיט"),
    lede: S("How to keep it the way it left the bench.",
            "איך לשמור על התכשיט כפי שיצא מהסדנה."),
    body: [
      [S("Every day", "בשגרה"),
       S("Put it on last and take it off first. Scent, lotion and hairspray dull a polish and settle under a pavé; chlorine and salt water are worse. A piece taken off before a shower will outlast one that is not.",
         "ענדו אותו אחרון והסירו אותו ראשון. בושם, קרמים ותרסיס לשיער מעמעמים את הברק ומצטברים מתחת לשיבוץ; כלור ומי ים מזיקים עוד יותר. תכשיט שמוסר לפני המקלחת ישמור על מראהו זמן רב יותר.")],
      [S("Cleaning it yourself", "ניקוי בבית"),
       S("Warm water, a drop of plain soap, a soft brush, two minutes, then dry it properly with a lint-free cloth. Nothing else. No ultrasonic tank at home, no ammonia, no toothpaste. An ultrasonic bath can shift a stone that was perfectly set.",
         "מים פושרים, טיפה של סבון עדין ומברשת רכה למשך שתי דקות, ואחר כך ייבוש יסודי במטלית שאינה משירה סיבים. זה הכול. אין להשתמש במכשיר אולטרסוני ביתי, באמוניה או במשחת שיניים. ניקוי אולטרסוני עלול להזיז אבן משובצת.")],
      [S("Keeping it", "אחסון"),
       S("Separately, in the pouch it came in. Diamond is the hardest thing in the box and will scratch everything else in it, including another diamond's girdle.",
         "בנפרד, בנרתיק המקורי. יהלום הוא החומר הקשה ביותר בקופסה ועלול לשרוט כל דבר אחר, גם יהלום אחר.")],
      [S("Once a year", "בדיקה שנתית"),
       S("Send it in. Ten minutes under a loupe finds a claw that has moved before it becomes a stone on a pavement. It costs nothing.",
         "שלחו אותו אלינו פעם בשנה. עשר דקות מתחת לזכוכית מגדלת מספיקות כדי לגלות ציפורן שזזה, לפני שאבן הולכת לאיבוד. הבדיקה ללא תשלום.")]
    ]
  },
  {
    slug: "authenticity",
    title: S("Authenticity & Certificates", "מקוריות ותעודות"),
    lede: S("What proves the piece is what the house says it is.",
            "מה מבטיח שהתכשיט הוא בדיוק מה שאנחנו מצהירים."),
    body: [
      [S("Every stone is graded before it is set", "כל אבן מדורגת לפני השיבוץ"),
       S("Independently, by GIA or IGI, and you see the report before the stone goes on the bench. The house does not grade its own stones and does not ask you to take its word for a colour or a clarity.",
         "הדירוג נעשה באופן עצמאי, במעבדות GIA או IGI, ואתם רואים את הדוח לפני שהאבן משובצת. איננו מדרגים את האבנים בעצמנו ואיננו מבקשים שתסמכו על המילה שלנו לגבי צבע או ניקיון.")],
      [S("What travels with the piece", "מה מצורף לתכשיט"),
       S("The laboratory report for the principal stone, a house certificate naming the metal, the total weight, the count and the date it was finished, and a valuation written for an insurer. All three carry your name.",
         "דוח מעבדה לאבן המרכזית, תעודה מטעם הבית המפרטת את המתכת, המשקל הכולל, מספר האבנים ותאריך הייצור, והערכת שווי לחברת הביטוח. שלושת המסמכים ערוכים על שמכם.")],
      [S("The mark", "החותם"),
       S("Every piece carries the house mark and its own reference, struck where it can be read. Quote that reference and the house can tell you what it is, when it was made and what is in it.",
         "כל תכשיט נושא את סמל הבית ומק\"ט ייחודי, מוטבעים במקום גלוי. לפי המק\"ט נוכל לומר לכם מהו התכשיט, מתי נוצר וממה הוא עשוי.")],
      [S("Lab-grown is said, not hidden", "יהלומי מעבדה מסומנים בגלוי"),
       S("Where a stone is grown rather than mined it says so on the report, on the house certificate and on the invoice. The house sells both and conceals neither.",
         "אבן שגודלה במעבדה ולא נכרתה מסומנת ככזו בדוח, בתעודת הבית ובחשבונית. אנו מציעים את שני הסוגים ואיננו מסתירים אף אחד מהם.")],
      [S("If you are ever unsure", "במקרה של ספק"),
       S("Send the reference to concierge@silavu.com. The house will confirm, in writing, whether a piece came from it.",
         "שלחו את המק\"ט אל concierge@silavu.com, ונאשר בכתב אם התכשיט יצא מהסדנה שלנו.")]
    ]
  },
  {
    slug: "delivery",
    title: S("Shipping & Delivery", "משלוח ומסירה"),
    lede: S("How a piece reaches you.",
            "איך התכשיט מגיע אליכם."),
    body: [
      [S("By hand, where we can", "מסירה אישית, היכן שאפשר"),
       S("In Dubai and in Tel Aviv a piece is brought to you, by appointment, by someone from the house. There is no charge for this and it is the way the house prefers.",
         "בדובאי ובתל אביב התכשיט נמסר לכם אישית, בתיאום מראש, על ידי נציג הבית. המסירה ללא תשלום, וזו הדרך המועדפת עלינו.")],
      [S("Everywhere else", "לשאר העולם"),
       S("Insured door-to-door carriage for the full value, signature required, tracked from the moment it leaves the workshop. Carriage and insurance are on the house. Duties and import tax at the destination are not, and are yours.",
         "משלוח מבוטח מדלת לדלת בשווי המלא, בחתימה ובמעקב מרגע היציאה מהסדנה. עלות המשלוח והביטוח עלינו. מכס ומיסי יבוא במדינת היעד חלים על הלקוח.")],
      [S("When", "מועדים"),
       S("A finished piece leaves within three working days of payment clearing. A commission is four to six weeks from the order, and you are told the week it will be ready as soon as the stones are chosen.",
         "תכשיט מוכן נשלח תוך שלושה ימי עסקים מקבלת התשלום. הזמנה אישית נמשכת ארבעה עד שישה שבועות, ומיד לאחר בחירת האבנים נודיע לכם באיזה שבוע היא תהיה מוכנה.")],
      [S("If something is wrong on arrival", "אם התכשיט הגיע פגום"),
       S("Tell the house within forty-eight hours and do not sign for a package whose seal is broken. A piece that arrives damaged is replaced or remade, carried both ways at the house's cost.",
         "הודיעו לנו תוך 48 שעות, ואל תחתמו על חבילה שהחותם שלה פגום. תכשיט שהגיע פגום יוחלף או ייוצר מחדש, והמשלוח לשני הכיוונים על חשבוננו.")]
    ]
  }
];
