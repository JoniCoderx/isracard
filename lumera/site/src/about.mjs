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
  desc: S("SILAVU was founded by designer Ariel Silas: jewellery with a strong identity, brought to life by skilled craftsmen in Dubai. MOMENT, ICON and SOUL, connected by one signature.",
          "את SILAVU ייסד המעצב אריאל סיילס: תכשיטים בעלי זהות חזקה, שקמים לחיים בידי בעלי מלאכה מיומנים בדובאי. MOMENT, ICON ו־SOUL, מחוברות בחתימה אחת."),
  eyebrow: S("About SILAVU", "אודות SILAVU"),
  h1: S("Behind <em>SILAVU</em>", "מאחורי <em>SILAVU</em>"),
  portrait: "ariel-silas",
  name: S("Ariel Silas", "אריאל סיילס"),
  role: S("Founder", "מייסד"),
  /* written about him, in the house's own words (October 2026): who
     founded it, the vision, where the pieces are made, and the three
     collections. Nothing is added to what the house wrote. */
  letter: [
    S("SILAVU was founded by Ariel Silas, a designer with a background in 3D and visual design. His experience includes creative collaborations with Jacob & Co., where his eye for detail, proportion and precision continued to develop.",
      "את SILAVU ייסד אריאל סיילס, מעצב עם רקע בעיצוב תלת־ממדי ובעיצוב חזותי. ניסיונו כולל שיתופי פעולה יצירתיים עם \u2066Jacob & Co.\u2069, שבמסגרתם המשיכה להתפתח עינו לפרטים, לפרופורציה ולדיוק."),
    S("Ariel created SILAVU with a clear vision: jewellery with a strong identity, designed to feel as good on the body as it looks. Every piece is considered down to the smallest detail, from its proportions and setting to the way it catches the light.",
      "אריאל יצר את SILAVU מתוך חזון ברור: תכשיטים בעלי זהות חזקה, שמעוצבים להרגיש על הגוף טוב כפי שהם נראים. כל תכשיט נשקל עד לפרט הקטן ביותר — מהפרופורציות והשיבוץ ועד לאופן שבו הוא תופס את האור."),
    S("SILAVU designs are brought to life by skilled craftsmen in Dubai, combining precise production with careful hand-finishing.",
      "עיצובי SILAVU קמים לחיים בידי בעלי מלאכה מיומנים בדובאי, בשילוב של ייצור מדויק וגימור קפדני בעבודת יד."),
    S("MOMENT, ICON and SOUL are three distinct collections, all connected by the SILAVU signature.",
      "\u2066MOMENT\u2069, \u2066ICON\u2069 ו־\u2066SOUL\u2069 הן שלוש קולקציות נפרדות, שכולן מחוברות בחתימת SILAVU.")
  ],

  cta1: S("Discover the collection", "לגלות את הקולקציה"),
  cta2: S("Start a conversation", "לשיחה אישית")
};
