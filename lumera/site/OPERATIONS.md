# SILAVU site: the steps only the house can take

These are the steps the code is ready for but that need a decision, an account or a figure from the business.
Once the admin is connected (`ADMIN_SETUP.md` at the repository root), the price figures, contact details, socials and every text below are changed in the admin instead of in these files.
Rebuild after any change (`cd lumera/site/src && node build.mjs`); CI regenerates the static site on push.

## 1. The price list (builder estimate)

- File: `lumera/site/src/pricing.json`.
- Until `approved` is `true`, `updated` holds a date (YYYY-MM-DD) and that date is younger than `maxAgeDays`, the builder shows **"Price on request"** and no number. The saved design picture follows the same rule.
- Once approved, the builder shows "Estimated price" with the note:
  "מחיר משוער לעיצוב שבחרתם. המחיר הסופי יאושר לאחר בחירת האבנים והמפרט."
- The figures there today (metal 6,500 / 9,500 AED, making 9,000 AED, stone curves) are the working figures from the design stage. **They have not been checked against a house price list.** Replace them, fill in `source` and `updated`, then set `approved: true`.
- Exchange rates (`fx`) have their own `approved`, `updated` and `maxAgeDays` (14 days by default). Without approved, dated rates, only AED is shown and the currency buttons are hidden.

## 2. Sending the enquiry form

- Live since 6 October 2026: `data-to="concierge@silavu.com"` on `<form id="cform">` in `src/body.mjs`. The form posts through FormSubmit (formsubmit.co, free).
- **One step left for the house:** the first real enquiry makes FormSubmit email concierge@silavu.com an **Activate** link. Click it once; enquiries are delivered from then on. Until then nothing arrives.
- The reader gets an automatic reply in their language when they leave an email address; the form gives way to a thank-you card. On any failure the page says so, keeps everything typed and offers "Continue in email".
- The privacy page names FormSubmit as the delivery service.
- To use your own server instead, put its URL in `data-endpoint=""` (JSON POST of `{ name, city, contact, want, selection, message, lang, page, text }`; success only on 2xx).

## 3. Moving to the house domain

1. Write the domain (for example `silavu.com`) as the only line of `lumera/site/CNAME`.
2. Push. The generator then uses `https://<domain>` for canonical links, hreflang, og:url, the sitemap, robots.txt and the structured data, all together. GitHub Pages serves the site from the domain.
3. Set the DNS records GitHub Pages asks for, and turn on "Enforce HTTPS" in the repository's Pages settings.

## 4. Search Console (after the domain is live)

1. Add the domain property in Google Search Console and verify it (DNS TXT record).
2. Submit `https://<domain>/sitemap.xml`. It lists `/`, `/he/`, every piece page in English and Hebrew (each naming its pair), and the documents.
3. Use URL Inspection on `/`, `/he/` and one piece page (`/pieces/knot/`, `/he/pieces/knot/`) and request indexing.
4. Run the Rich Results Test on a piece page. The pieces carry `Product` data **without** an `Offer`, because the house publishes no prices. Google therefore will not show price-based product snippets. That is expected, and no placeholder price should be added to get them.
5. If the old `github.io` address was indexed, keep it serving until the domain shows as indexed. GitHub Pages redirects to the custom domain on its own.

## 5. Language addresses

- English: `/`. Hebrew: `/he/`. French, Russian and Arabic: `/?lang=fr|ru|ar`.
- Pieces: `/pieces/<id>/` and `/he/pieces/<id>/`.
- Choosing a language in the menu moves to that address, so a copied link opens in the same language.
