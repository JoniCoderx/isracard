/* The site as it was on 6 October 2026, as content documents.

   This is what the admin imports on day one, and what a build uses when it
   has no published release to read (a fresh checkout, or the backend not yet
   set up). Once the admin is live the database is the authority; this file
   only changes when the code gains something new to edit.

   Every document is { kind, title, sort, data }. Product data is the piece
   object exactly as the storefront has always rendered it, plus the fields
   the admin manages (price, status, badge). */
import fs from "node:fs";
import { PIECES, CATS, SOON } from "../pieces.mjs";
import { POLICIES } from "../policies.mjs";
import { ABOUT } from "../about.mjs";

const S = (en, he) => ({ en, he });
const SRC = new URL("..", import.meta.url).pathname;
const clone = (o) => JSON.parse(JSON.stringify(o));

export { HOME_SECTIONS } from "./sections.mjs";
import { HOME_SECTIONS } from "./sections.mjs";

/* the labels on the configurator's shape buttons */
export const CUTS = [
  ["round", "Round", "עגול"], ["oval", "Oval", "אובל"], ["cushion", "Cushion", "קושן"], ["princess", "Princess", "פרינסס"],
  ["emerald", "Emerald", "אמרלד"], ["marquise", "Marquise", "מרקיזה"], ["pear", "Pear", "טיפה"], ["baguette", "Baguette", "באגט"]
];

export function seedDocs() {
  const docs = {};
  const put = (key, kind, title, sort, data) => { docs[key] = { kind, title, sort, data }; };

  put("settings", "settings", "Site settings", 0, {
    contact: { email: "concierge@silavu.com", whatsapp: "", phone: "" },
    // where enquiries go: the backend's enquiry function once it exists, else FormSubmit to this inbox
    enquiry: { inbox: "concierge@silavu.com" },
    socials: { instagram: "", tiktok: "", youtube: "", pinterest: "" },
    analytics: { mode: "consent", retentionDays: 400 },
    features: { tryon: true },
    announcement: { enabled: false, text: S("", ""), href: "" }
  });

  put("collections", "collections", "Collection", 0, { cats: clone(CATS), soon: clone(SOON) });

  PIECES.forEach((p, i) => put("product:" + p.id, "product", p.plain || p.id, i + 1, {
    ...clone(p),
    price: { mode: "on_request" },
    status: "live",
    badge: null
  }));

  put("page:home", "page", "Home page", 0, {
    sections: Object.fromEntries(HOME_SECTIONS.map(s => [s.id, { hidden: false }])),
    blocks: []
  });
  put("strings", "strings", "Page text", 0, { overrides: {} });
  put("translations", "translations", "Other languages", 0, { ar: {}, fr: {}, ru: {} });
  put("navigation", "navigation", "Menus", 0, { extra: [], redirects: [] });
  put("seo", "seo", "Search and sharing", 0, {
    home: {
      title: S("SILAVU | Fine Jewellery", "SILAVU | תכשיטי יוקרה"),
      description: S("SILAVU, The Line of Desire. Fine jewellery by appointment in Dubai and Tel Aviv: the MOMENT bracelet, ICON ring and SOUL necklace, and bespoke diamond pieces.",
        "‏SILAVU, The Line of Desire. תכשיטי יוקרה מדובאי ותל אביב: צמיד SILAVU MOMENT, טבעת ICON ושרשרת SOUL, תכשיטי יהלומים בהתאמה אישית ופגישות פרטיות בתיאום מראש.")
    }
  });

  POLICIES.forEach((d, i) => put("policy:" + d.slug, "policy", d.title.en, i, clone(d)));
  put("about", "about", "About", 0, clone(ABOUT));

  const pricing = JSON.parse(fs.readFileSync(SRC + "pricing.json", "utf8")); delete pricing._read_me;
  put("configurator", "configurator", "The Line", 0, {
    cuts: CUTS.map(([id, en, he]) => ({ id, enabled: true, en, he })),
    origins: [{ id: "lab", enabled: true, en: "Lab-grown", he: "מעבדה" }, { id: "natural", enabled: true, en: "Natural", he: "טבעי" }],
    metals: [
      { id: "white", enabled: true, en: "18K white gold", he: "זהב לבן 18K" },
      { id: "yellow", enabled: true, en: "18K yellow gold", he: "זהב צהוב 18K" },
      { id: "rose", enabled: true, en: "18K rose gold", he: "זהב ורוד 18K" },
      { id: "platinum", enabled: true, en: "Platinum", he: "פלטינה" }
    ],
    carat: { options: [2, 4, 6, 8, 10, 15, 20], min: 2, max: 20 },
    wrists: { options: [15, 16, 17, 18, 19, 20] },
    defaults: { cut: "round", origin: "lab", metal: "white", ct: 6, wrist: 17 },
    pricing
  });
  return docs;
}
