/* About SILAVU: the designer, and the atelier that makes what he draws.

   Only what the house has said about itself is written here. The atelier is
   described by its crafts, not by invented names: when the team wants to be
   named, each role takes a name and a photograph without the page changing.
   The portrait is a reserved frame until a real photograph is supplied; set
   `portrait` to the image name in img/ (as ariel-1200.jpg, ariel-800.jpg) and
   the frame shows it. */

const S = (en, he) => ({ en, he });

export const ABOUT = {
  slug: "about",
  title: S("About", "אודות"),
  seo: S("About SILAVU | Ariel Silas", "אודות SILAVU | אריאל סילס"),
  desc: S("SILAVU is the house of Ariel Silas, a high jewellery designer in Dubai who previously designed for Jacob & Co., and of the ten specialists in his atelier.",
          "‏SILAVU הוא בית התכשיטים של אריאל סילס, מעצב תכשיטי יוקרה בדובאי שעיצב בעבר עבור Jacob & Co., ושל עשרת אנשי המקצוע בסדנה שלו."),
  eyebrow: S("About SILAVU", "אודות SILAVU"),
  h1: S("One designer. <em>Ten pairs of hands.</em>", "מעצב אחד. <em>עשרה זוגות ידיים.</em>"),
  lede: S("SILAVU is the house of Ariel Silas, a high jewellery designer working in Dubai, and of the ten specialists who make what he draws.",
          "‏SILAVU הוא בית התכשיטים של אריאל סילס, מעצב תכשיטי יוקרה הפועל בדובאי, ושל עשרת אנשי המקצוע שמייצרים את מה שהוא משרטט."),
  portrait: null,
  name: S("Ariel Silas", "אריאל סילס"),
  role: S("Founder and designer", "מייסד ומעצב"),
  founder: [
    S("Before founding SILAVU, Ariel designed high jewellery for Jacob & Co. He left with two convictions: a piece starts from its stones, and the metal around them should be as quiet as it can be.",
      "לפני שייסד את SILAVU עיצב אריאל תכשיטי יוקרה עבור <bdi>Jacob & Co.</bdi> הוא יצא משם עם שתי אמונות: תכשיט מתחיל מהאבנים שלו, והמתכת סביבן צריכה להיות שקטה ככל האפשר."),
    S("He draws every SILAVU piece himself, sits with the client when the stones are chosen, and is the last person to look at a piece before it is signed and boxed. Nothing leaves the bench without his approval.",
      "הוא משרטט בעצמו כל תכשיט של SILAVU, יושב עם הלקוח בזמן בחירת האבנים, והוא האחרון שבודק כל תכשיט לפני שהוא נחתם ונארז. שום תכשיט לא יוצא מהסדנה בלי האישור שלו.")
  ],
  atelierH: S("The atelier in Dubai", "הסדנה בדובאי"),
  atelierP: S("Ten specialists, each responsible for one stage of the work, and every one of them working to Ariel's drawing.",
              "עשרה אנשי מקצוע, כל אחד אחראי על שלב אחד בעבודה, וכולם עובדים לפי השרטוט של אריאל."),
  roles: [
    [S("Diamonds", "יהלומים"),
     S("Source, match and check every stone against its GIA or IGI report before it reaches the bench.",
       "מאתרים, מתאימים ובודקים כל אבן מול תעודת GIA או IGI שלה, לפני שהיא מגיעה לשולחן הצורף.")],
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
     S("Arrange private viewings in Dubai and Tel Aviv, and look after every piece for as long as you own it.",
       "מתאמים פגישות פרטיות בדובאי ובתל אביב, ומלווים כל תכשיט כל עוד הוא בבעלותכם.")]
  ],
  close: S("Every SILAVU piece is drawn by Ariel, made by the atelier, and signed only when he is satisfied with it.",
           "כל תכשיט של SILAVU משורטט על ידי אריאל, נעשה בסדנה, ונחתם רק כשהוא מרוצה ממנו."),
  cta: S("Book a private viewing", "קביעת פגישה פרטית")
};
