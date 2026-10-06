/* The home page's chapters, in their designed order. The order is part of the
   design (each chapter hands over to the next), so it is fixed in code; the
   owner can hide the ones marked hideable and add text bands between them. */
const S = (en, he) => ({ en, he });
export const HOME_SECTIONS = [
  { id: "hero", label: S("Opening", "פתיחה"), hideable: false },
  { id: "house", label: S("The house", "הבית"), hideable: true },
  { id: "inside", label: S("The box", "הקופסה"), hideable: true },
  { id: "craft", label: S("The signature", "החתימה"), hideable: true },
  { id: "collection", label: S("Collection", "הקולקציה"), hideable: false },
  { id: "macro", label: S("Light goes in. Fire comes out.", "האור נכנס. האש יוצאת."), hideable: true },
  { id: "build", label: S("The Line (configurator)", "הקו (עיצוב צמיד)"), hideable: true },
  { id: "enquire", label: S("Enquire", "פנייה"), hideable: false },
  { id: "end", label: S("Footer", "תחתית"), hideable: false }
];
export const BLOCK_SLOTS = ["house", "inside", "craft", "collection", "macro", "build"];
