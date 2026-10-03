/* About SILAVU: Ariel Silas, in his own words.

   Only what the house has said about itself is written here. No team size,
   no workshop inventory, no other houses: a short letter from the person who
   made it, the mark the collection grows from, and two ways in. The name is
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
  letter: [
    S("I’m Ariel Silas. I created SILAVU out of a love for flowing lines, for light, and for the details you only discover up close. I like a piece that has presence, and still feels natural on the person wearing it.",
      "אני אריאל סיילס. את SILAVU יצרתי מתוך משיכה לקווים זורמים, לאור ולפרטים שמגלים רק מקרוב. אני אוהב תכשיט שיש לו נוכחות, ועדיין מרגיש טבעי על מי שעונד אותו."),
    S("The SILAVU mark is where the collection begins: a line that meets itself, and finds a different expression in every piece. From it come MOMENT, ICON and SOUL, three ways to wear the same signature.",
      "סמל SILAVU הוא נקודת המוצא של הקולקציה — קו שנפגש עם עצמו ומקבל בכל תכשיט ביטוי אחר. ממנו נולדים MOMENT, ICON ו־SOUL, שלוש דרכים לענוד את אותה חתימה."),
    S("I invite you to discover the pieces at your own pace. And if you have an idea of your own, I’d be glad to begin with a conversation.",
      "אני מזמין אתכם להכיר את התכשיטים בקצב שלכם. ואם יש לכם רעיון משלכם, אשמח להתחיל משיחה.")
  ],
  cta1: S("Discover the collection", "לגלות את הקולקציה"),
  cta2: S("Start a conversation", "לשיחה אישית")
};
