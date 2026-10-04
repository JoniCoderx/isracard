/* About SILAVU: Ariel Silas, in the third person.

   Only what the house has said about itself is written here. No team size,
   no workshop inventory: two short paragraphs about the person who made it, the mark the collection grows from, and two ways in. The name is
   Ariel Silas in English and אריאל סיילס in Hebrew. The portrait lives in
   public/ as <portrait>-800.jpg and <portrait>-1100.jpg. */

const S = (en, he) => ({ en, he });

export const ABOUT = {
  slug: "about",
  title: S("About", "אודות"),
  seo: S("About SILAVU | Ariel Silas", "אודות SILAVU | אריאל סיילס"),
  desc: S("SILAVU by Ariel Silas: flowing lines, light, and details you only discover up close. MOMENT, ICON and SOUL are three ways to wear one signature.",
          "SILAVU של אריאל סיילס: קווים זורמים, אור ופרטים שמתגלים רק מקרוב. MOMENT, ICON ו־SOUL הם שלוש דרכים לענוד את אותה חתימה."),
  eyebrow: S("About SILAVU", "אודות SILAVU"),
  h1: S("Some jewellery simply <em>feels like yours.</em>", "יש תכשיטים שפשוט <em>מרגישים שלכם.</em>"),
  portrait: "ariel-silas",
  name: S("Ariel Silas", "אריאל סיילס"),
  role: S("Founder", "מייסד"),
  /* written about him, not by him: the two paragraphs as the house gave
     them, word for word in Hebrew. No number of years, no title at another
     house, no awards and no tie between the two names is added. */
  letter: [
    S("Behind SILAVU is Ariel Silas, a designer with years of experience in 3D modelling and design. In his work at Jacob & Co. he designed watches and watch dials — a world in which proportion, depth and finish carry meaning in every detail.",
      "מאחורי SILAVU עומד אריאל סיילס, מעצב בעל שנות ניסיון במידול תלת־ממדי ובעיצוב. במסגרת עבודתו ב־Jacob & Co. עסק בעיצוב שעונים ולוחות שעון — עולם שבו פרופורציות, עומק וגימור מקבלים משמעות בכל פרט."),
    S("Ariel brings the same attention to SILAVU: sculptural lines, the play of light, and jewellery with presence that feels natural on the body. The SILAVU signature connects MOMENT, ICON and SOUL, each giving it an expression of its own.",
      "את אותה תשומת לב מביא אריאל אל SILAVU: קווים פיסוליים, משחקי אור ותכשיטים בעלי נוכחות שמרגישים טבעיים על הגוף. חתימת המותג מחברת בין MOMENT, ICON ו־SOUL, כשכל אחד מעניק לה ביטוי משלו.")
  ],

  cta1: S("Discover the collection", "לגלות את הקולקציה"),
  cta2: S("Start a conversation", "לשיחה אישית")
};
