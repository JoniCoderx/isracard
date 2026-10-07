// Two checks on what the public form sends, without any outside service
// (no reCAPTCHA, so nothing about the visitor goes to Google):
//
// * Proof of work. Before sending, the page finds a number that, hashed with
//   the enquiry's own key, starts with POW_BITS zero bits. A person's browser
//   does that in well under a second; a bot that posts thousands of forms has
//   to spend that second on each one, and a bot that does not run the page's
//   script cannot send at all. Together with the hidden honeypot field and the
//   per-address rate limits, this is the form's bot protection.
//
// * Words. An enquiry whose words look abusive is flagged for the house, not
//   rejected: a real customer who swears is still a customer.
export const POW_BITS = 12;

export async function powOk(idem: unknown, nonce: unknown): Promise<boolean> {
  if (typeof idem !== "string" || !/^[0-9a-f-]{36}$/i.test(idem)) return false;
  if (typeof nonce !== "string" && typeof nonce !== "number") return false;
  const n = String(nonce); if (!/^\d{1,12}$/.test(n)) return false;
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(idem.toLowerCase() + ":" + n)));
  let bits = POW_BITS, i = 0;
  while (bits >= 8) { if (d[i++] !== 0) return false; bits -= 8; }
  return bits === 0 || (d[i] >> (8 - bits)) === 0;
}

/* English and Hebrew; whole words, Hebrew with its one-letter prefixes */
const EN = ["fuck\\w*", "motherfuck\\w*", "shit\\w*", "bitch\\w*", "cunt\\w*", "asshole\\w*", "bastard\\w*", "dick(head)?s?", "whore\\w*", "slut\\w*", "fag\\w*", "nigg\\w*", "retard\\w*", "wank\\w*", "twat\\w*", "scam(mer)?s?"];
const HE = ["זונה", "זונות", "שרמוטה", "שרמוטות", "כוסאמק", "כוס אמא", "כוס אמק", "כוסית", "מזדיין", "לזיין", "חרא", "מניאק", "מניאקים", "בן זונה", "בת זונה", "קוקסינל", "הומו מסריח", "מפגר", "מפגרת", "אידיוט", "טמבל", "נוכל", "נוכלים", "רמאי", "רמאים"];
const RE_EN = new RegExp("\\b(" + EN.join("|") + ")\\b", "i");
const RE_HE = new RegExp("(^|[^\\u0590-\\u05FF])[והשבלכמ]?(" + HE.map(w => w.replace(/ /g, "\\s+")).join("|") + ")(?=$|[^\\u0590-\\u05FF])");

export function offensive(...texts: unknown[]): string | null {
  for (const t of texts) {
    const s = String(t ?? "");
    const m = s.match(RE_EN) || s.match(RE_HE);
    if (m) return (m[2] || m[1] || m[0]).trim();
  }
  return null;
}
