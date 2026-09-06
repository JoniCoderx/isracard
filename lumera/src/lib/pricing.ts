// Illustrative pricing + material model for BUILD YOUR SILAVU.
// Indicative only — the concierge confirms the final figure.

export type Origin = "natural" | "lab";
export type Metal = "white" | "yellow" | "rose" | "platinum";
export type Quality = "VS" | "VVS" | "FL";

export const ORIGINS: { id: Origin; label: string; note: string }[] = [
  { id: "lab", label: "Lab-Grown", note: "Identical composition · exceptional value" },
  { id: "natural", label: "Natural", note: "Earth-formed · certified provenance" },
];

export const METAL_INFO: Record<Metal, { label: string; color: string; roughness: number; metalness: number; env: number }> = {
  white: { label: "18K White", color: "#e8e8ee", roughness: 0.18, metalness: 1, env: 1.4 },
  yellow: { label: "18K Yellow", color: "#e7c86a", roughness: 0.22, metalness: 1, env: 1.3 },
  rose: { label: "18K Rose", color: "#e6b298", roughness: 0.22, metalness: 1, env: 1.3 },
  platinum: { label: "Platinum", color: "#dfe1e6", roughness: 0.12, metalness: 1, env: 1.6 },
};
export const METALS = (Object.keys(METAL_INFO) as Metal[]).map((id) => ({ id, ...METAL_INFO[id] }));

export const QUALITIES: { id: Quality; label: string; clarity: string; color: string; mult: number; rough: number }[] = [
  { id: "VS", label: "VS", clarity: "VS1–VS2", color: "F–G", mult: 1, rough: 0.04 },
  { id: "VVS", label: "VVS", clarity: "VVS1–VVS2", color: "E–F", mult: 1.4, rough: 0.02 },
  { id: "FL", label: "Flawless", clarity: "IF–FL", color: "D", mult: 2.1, rough: 0.0 },
];

// Total carat weight options
export const SIZES = [2, 4, 6, 8, 10, 15, 20];
export function sizeLabel(ct: number) {
  return ct >= 20 ? "20 CT+" : `${ct} CT`;
}

export type SilavuConfig = {
  origin: Origin;
  totalCt: number;
  quality: Quality;
  metal: Metal;
};

export const DEFAULT_CONFIG: SilavuConfig = {
  origin: "lab",
  totalCt: 6,
  quality: "VVS",
  metal: "white",
};

function pricePerCarat(cfg: SilavuConfig) {
  const base = cfg.origin === "natural" ? 16000 : 3400;
  // larger total weight implies larger individual stones → non-linear premium
  const sizePremium = 1 + Math.pow(cfg.totalCt / 6, 1.25) * (cfg.origin === "natural" ? 1.4 : 0.6);
  const q = QUALITIES.find((x) => x.id === cfg.quality)!.mult;
  return base * sizePremium * q;
}

export function estimatePrice(cfg: SilavuConfig) {
  const stones = pricePerCarat(cfg) * cfg.totalCt;
  const metalCost = cfg.metal === "platinum" ? 8200 : cfg.metal === "white" ? 5200 : 5600;
  const craftsmanship = 12000 + stones * 0.05;
  return { stones, metalCost, craftsmanship, total: stones + metalCost + craftsmanship };
}

// Visual stone scale for the 3D bracelet, from total carat.
export function stoneScaleFor(totalCt: number) {
  return 0.6 + Math.min(1.8, Math.pow(totalCt / 6, 0.6) * 0.7);
}
