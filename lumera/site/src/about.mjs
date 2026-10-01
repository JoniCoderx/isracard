/* About SILAVU: the designer, the atelier that makes what he draws, and how
   to meet the house.

   Only what the house has said about itself is written here: Ariel Silas
   founded it and draws every piece, he designed for Jacob & Co. before, the
   atelier is in Dubai with ten specialists, and pieces are shown privately in
   Dubai and Tel Aviv. The atelier is described by its crafts, not by invented
   names: when the team wants to be named, each role takes a name without the
   page changing. The portrait lives in public/ as <portrait>-800.jpg and
   <portrait>-1100.jpg. */

const S = (en, he) => ({ en, he });

export const ABOUT = {
  slug: "about",
  title: S("About", "אודות"),
  seo: S("About SILAVU | Ariel Silas", "אודות SILAVU | אריאל סילס"),
  desc: S("SILAVU is the high jewellery house of designer Ariel Silas. Every piece is drawn by him and made by ten specialists in his Dubai atelier. Private viewings in Dubai and Tel Aviv.",
          "‏SILAVU הוא בית תכשיטי היוקרה של המעצב אריאל סילס. כל תכשיט משורטט על ידו ונעשה בידי עשרה אנשי מקצוע בסדנה שלו בדובאי. פגישות פרטיות בדובאי ובתל אביב."),
  h1: S("The house of <em>Ariel Silas.</em>", "בית התכשיטים של <em>אריאל סילס.</em>"),
  lede: S("SILAVU is a high jewellery house founded by the designer Ariel Silas. He draws every piece, and ten specialists in his Dubai atelier make it.",
          "‏SILAVU הוא בית תכשיטי יוקרה שייסד המעצב אריאל סילס. הוא משרטט כל תכשיט, ועשרה אנשי מקצוע בסדנה שלו בדובאי מייצרים אותו."),
  portrait: "ariel-silas",
  name: S("Ariel Silas", "אריאל סילס"),
  role: S("Founder and designer", "מייסד ומעצב"),
  /* the four facts a reader looks for first */
  facts: [
    [S("Founder", "מייסד"), S("Ariel Silas", "אריאל סילס")],
    [S("Atelier", "סדנה"), S("Dubai", "דובאי")],
    [S("Specialists", "אנשי מקצוע"), S("Ten", "עשרה")],
    [S("Private viewings", "פגישות פרטיות"), S("Dubai and Tel Aviv", "דובאי ותל אביב")]
  ],
  founderH: S("Before SILAVU", "לפני SILAVU"),
  founder: [
    S("Ariel designed high jewellery for Jacob & Co. before founding SILAVU. He took two convictions from that work: a piece begins with its stones, and the metal around them should hold them without competing for attention.",
      "לפני שייסד את SILAVU עיצב אריאל תכשיטי יוקרה עבור <bdi>Jacob & Co.</bdi> מהעבודה שם הוא לקח שתי אמונות: תכשיט מתחיל מהאבנים שלו, והמתכת סביבן צריכה להחזיק אותן בלי להתחרות בהן."),
    S("He draws every SILAVU piece himself. He sits with each client when the stones are chosen, and he is the last to examine a piece before it is signed and boxed. Nothing leaves the atelier without his approval.",
      "הוא משרטט בעצמו כל תכשיט של SILAVU. הוא יושב עם כל לקוח בזמן בחירת האבנים, והוא האחרון שבוחן כל תכשיט לפני שהוא נחתם ונארז. שום תכשיט לא יוצא מהסדנה בלי האישור שלו.")
  ],
  atelierH: S("The atelier in Dubai", "הסדנה בדובאי"),
  atelierP: S("Ten specialists, each responsible for one stage of the work, all working from Ariel's drawings.",
              "עשרה אנשי מקצוע, כל אחד אחראי על שלב אחד בעבודה, וכולם עובדים לפי השרטוטים של אריאל."),
  roles: [
    [S("Diamonds", "יהלומים"),
     S("Source and match every stone, and check it against its GIA or IGI report before it reaches the bench.",
       "מאתרים ומתאימים כל אבן, ובודקים אותה מול תעודת GIA או IGI שלה לפני שהיא מגיעה לשולחן הצורף.")],
    [S("Design and 3D", "עיצוב ותלת־ממד"),
     S("Turn Ariel's drawings into models accurate to a tenth of a millimetre.",
       "הופכים את השרטוטים של אריאל למודלים מדויקים לעשירית המילימטר.")],
    [S("Casting and goldsmithing", "יציקה וצורפות"),
     S("Cast the metal and build every link, hinge and clasp by hand.",
       "יוצקים את המתכת ובונים ביד כל חוליה, ציר וסוגר.")],
    [S("Stone setting", "שיבוץ"),
     S("Set each stone under the microscope, claw by claw.",
       "משבצים כל אבן תחת מיקרוסקופ, ציפורן אחר ציפורן.")],
    [S("Polishing and finishing", "ליטוש וגימור"),
     S("Bring the metal to a mirror finish without softening a single edge.",
       "מביאים את המתכת לברק מראה בלי לעגל אף קצה.")],
    [S("Client care", "ליווי לקוחות"),
     S("Arrange private viewings and look after every piece for as long as you own it.",
       "מתאמים פגישות פרטיות ומלווים כל תכשיט כל עוד הוא בבעלותכם.")]
  ],
  meetH: S("Meet the house", "להיפגש איתנו"),
  meetP: S("SILAVU pieces are shown privately, by appointment, in Dubai and Tel Aviv. Write to the concierge and a viewing is arranged at a time that suits you.",
           "תכשיטי SILAVU מוצגים בפגישה פרטית, בתיאום מראש, בדובאי ובתל אביב. כתבו לקונסיירז' ונתאם פגישה בזמן שנוח לכם."),
  cta: S("Book a private viewing", "קביעת פגישה פרטית")
};
