// Single source of truth for the house identity.
export const BRAND = {
  name: "SILAVU",
  spaced: "S I L A V U",
  monogram: "S",
  city: "DUBAI",
  country: "UAE",
  tagline: "HIGH JEWELLERY",
  // Placeholder concierge channels — replace with the house's real details.
  whatsapp: "971500000000",
  instagram: "https://instagram.com",
  email: "concierge@silavu.example",
  address: "By appointment · DIFC, Dubai, United Arab Emirates",
} as const;

export function whatsappLink(message: string) {
  return `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const NAV = [
  { label: "The House", href: "/house" },
  { label: "The Showcase", href: "/showcase" },
  { label: "The SILAVU Line", href: "/the-line" },
  { label: "SILAVU Private", href: "/private" },
  { label: "The Stone", href: "/the-stone" },
  { label: "Private Room", href: "/private-room" },
] as const;
