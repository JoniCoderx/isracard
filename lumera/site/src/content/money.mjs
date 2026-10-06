/* Prices are stored as whole minor units (agorot, fils, cents) per currency.
   This turns them into the words a card and a specification row show. Pure:
   the admin uses it for its preview, the build for the page. */

export const CURRENCIES = {
  ILS: { symbol: "₪", minor: 100, he: (n) => `${n} ₪`, en: (n) => `₪${n}` },
  AED: { symbol: "AED", minor: 100, he: (n) => `${n} AED`, en: (n) => `AED ${n}` },
  USD: { symbol: "$", minor: 100, he: (n) => `${n} $`, en: (n) => `$${n}` },
  EUR: { symbol: "€", minor: 100, he: (n) => `${n} €`, en: (n) => `€${n}` }
};

const group = (major) => {
  const whole = Math.round(major * 100) / 100;
  const s = Number.isInteger(whole) ? String(whole) : whole.toFixed(2);
  const [a, b] = s.split(".");
  return a.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (b ? "." + b : "");
};

export function formatMoney(minor, cur) {
  const c = CURRENCIES[cur]; if (!c || !Number.isFinite(minor)) return null;
  const n = group(minor / c.minor);
  return { en: c.en(n), he: "⁦" + c.he(n) + "⁩" };
}

/* the currency a piece is shown in: the one it declares, else the first it has */
export function baseCurrency(price) {
  const a = (price && price.amounts) || {};
  if (price && price.base && a[price.base] != null) return price.base;
  return ["ILS", "AED", "USD", "EUR"].find(c => a[c] != null) || null;
}

/* "Price on request", "₪12,500" or "From ₪12,500", in both languages */
export function priceWords(price) {
  const mode = (price && price.mode) || "on_request";
  if (mode === "on_request") return { en: "Price on request", he: "מחיר לפי בקשה" };
  const cur = baseCurrency(price), m = cur ? formatMoney(price.amounts[cur], cur) : null;
  if (!m) return { en: "Price on request", he: "מחיר לפי בקשה" };
  if (mode === "from") return { en: "From " + m.en, he: "החל מ־" + m.he };
  return m;
}
