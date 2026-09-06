export type Category =
  | "Diamond Tennis"
  | "Bracelets"
  | "Rings"
  | "Necklaces"
  | "High Jewellery"
  | "Bespoke";

export type OriginSpec = {
  carat: string;
  clarity: string;
  color: string;
  certification: string;
  price: number; // AED
};

export type Piece = {
  slug: string;
  name: string;
  category: Category;
  metal: string;
  line: string; // one-line editorial descriptor
  story: string; // longer paragraph
  hue: [string, string]; // stone gradient for the WebGL-free presentation
  availability: string;
  sizing: string;
  natural: OriginSpec;
  lab: OriginSpec;
  featured?: boolean;
};

export const CATEGORIES: Category[] = [
  "Diamond Tennis",
  "Bracelets",
  "Rings",
  "Necklaces",
  "High Jewellery",
  "Bespoke",
];

export const PIECES: Piece[] = [
  {
    slug: "the-eternal-tennis",
    name: "The Eternal",
    category: "Diamond Tennis",
    metal: "18K White Gold",
    line: "A single unbroken line of light around the wrist.",
    story:
      "Fifty-two brilliants set in a continuous flexible line, each stone hand-matched for a seamless run of fire. The setting disappears; only the light remains.",
    hue: ["#ffffff", "#bcd2ff"],
    availability: "Available · Dubai atelier",
    sizing: "16–20 cm · adjusted to the wrist",
    natural: { carat: "12.84 CT", clarity: "VVS1–VVS2", color: "D–F", certification: "GIA certified", price: 214000 },
    lab: { carat: "12.84 CT", clarity: "VVS1–VVS2", color: "D–F", certification: "IGI certified", price: 48000 },
    featured: true,
  },
  {
    slug: "solitaire-noir",
    name: "Solitaire Noir",
    category: "Rings",
    metal: "Platinum",
    line: "One stone. Nothing else in the room.",
    story:
      "A high-set round brilliant on a knife-edge platinum band, engineered so the stone floats above the finger and drinks light from every angle.",
    hue: ["#ffffff", "#d8c6ff"],
    availability: "Made to order · 4–6 weeks",
    sizing: "EU 44–58 · resized in-house",
    natural: { carat: "3.01 CT", clarity: "VVS1", color: "D", certification: "GIA certified", price: 486000 },
    lab: { carat: "3.01 CT", clarity: "VVS1", color: "D", certification: "IGI certified", price: 61000 },
    featured: true,
  },
  {
    slug: "riviere-lumiere",
    name: "Rivière Lumière",
    category: "Necklaces",
    metal: "18K White Gold",
    line: "A river of graduated brilliants that falls to the throat.",
    story:
      "Forty-one graduated stones descending in perfect proportion, the largest resting exactly at the hollow of the throat. A quiet statement of scale.",
    hue: ["#ffffff", "#c9dcff"],
    availability: "Available · Dubai atelier",
    sizing: "40–44 cm",
    natural: { carat: "22.40 CT", clarity: "VVS", color: "D–E", certification: "GIA certified", price: 940000 },
    lab: { carat: "22.40 CT", clarity: "VVS", color: "D–E", certification: "IGI certified", price: 142000 },
    featured: true,
  },
  {
    slug: "obsidian-cuff",
    name: "Obsidian Cuff",
    category: "Bracelets",
    metal: "Blackened 18K Gold & Diamond",
    line: "Darkness set with a seam of light.",
    story:
      "A sculptural cuff in blackened gold, split by a single pavé seam. Worn day or night, it reads as architecture first, jewellery second.",
    hue: ["#eae6ff", "#9fb6e6"],
    availability: "Made to order · 6–8 weeks",
    sizing: "S · M · L",
    natural: { carat: "6.20 CT", clarity: "VS–VVS", color: "E–F", certification: "GIA certified", price: 168000 },
    lab: { carat: "6.20 CT", clarity: "VS–VVS", color: "E–F", certification: "IGI certified", price: 39000 },
  },
  {
    slug: "the-desert-star",
    name: "The Desert Star",
    category: "High Jewellery",
    metal: "Platinum & Diamond",
    line: "A high-jewellery piece built around a single rare stone.",
    story:
      "A one-of-one necklace constructed around a cushion-cut centre stone, framed by a radiating halo of tapered baguettes. A collector's piece, offered once.",
    hue: ["#fff7ea", "#e8c98f"],
    availability: "Unique piece · enquire",
    sizing: "Bespoke",
    natural: { carat: "18.06 CT", clarity: "IF", color: "D", certification: "GIA certified", price: 1400000 },
    lab: { carat: "18.06 CT", clarity: "IF", color: "D", certification: "IGI certified", price: 218000 },
    featured: true,
  },
  {
    slug: "linea-eternity",
    name: "Linea Eternity",
    category: "Rings",
    metal: "18K White Gold",
    line: "A full circle of matched brilliants, unbroken.",
    story:
      "A true eternity band with stones set the entire way around, each one calibrated to the millimetre so the line never breaks against the light.",
    hue: ["#ffffff", "#cfe0ff"],
    availability: "Available · Dubai atelier",
    sizing: "EU 44–58",
    natural: { carat: "4.10 CT", clarity: "VVS", color: "D–E", certification: "GIA certified", price: 96000 },
    lab: { carat: "4.10 CT", clarity: "VVS", color: "D–E", certification: "IGI certified", price: 21000 },
  },
];

export function getPiece(slug: string) {
  return PIECES.find((p) => p.slug === slug);
}

export function featuredPieces() {
  return PIECES.filter((p) => p.featured);
}
