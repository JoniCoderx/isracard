export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

const AED = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  maximumFractionDigits: 0,
});

export function formatAED(value: number) {
  return AED.format(Math.round(value));
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
