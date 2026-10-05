# SILAVU site: the steps only the house can take

These are the steps the code is ready for but that need a decision, an account or a figure from the business.
Rebuild after any change (`cd lumera/site/src && node build.mjs`); CI regenerates the static site on push.

## 1. The price list (builder estimate)

- File: `lumera/site/src/pricing.json`.
- Until `approved` is `true`, `updated` holds a date (YYYY-MM-DD) and that date is younger than `maxAgeDays`, the builder shows **"Price on request"** and no number. The saved design picture follows the same rule.
- Once approved, the builder shows "Estimated price" with the note:
  "מחיר משוער לעיצוב שבחרתם. המחיר הסופי יאושר לאחר בחירת האבנים והמפרט."
- The figures there today (metal 6,500 / 9,500 AED, making 9,000 AED, stone curves) are the working figures from the design stage. **They have not been checked against a house price list.** Replace them, fill in `source` and `updated`, then set `approved: true`.
- Exchange rates (`fx`) have their own `approved`, `updated` and `maxAgeDays` (14 days by default). Without approved, dated rates, only AED is shown and the currency buttons are hidden.

## 2. Sending the enquiry form

- Today the form has no server. The button reads **"Continue in email" / "המשך באימייל"** and opens the reader's email app. Nothing is sent until they press send there, and the page says so.
- **Quickest way to send for real: write the house inbox into `data-to=""`** on `<form id="cform">` in `src/body.mjs` (for example `data-to="concierge@silavu.com"`). The form then posts through FormSubmit (formsubmit.co, free):
  - the very first enquiry makes FormSubmit email that inbox an **Activate** link; click it once, and every enquiry after arrives as a table (name, city, contact, what they want, their selection, message, language, page);
  - when the reader leaves an email address, FormSubmit sends them an automatic reply at once, in their language ("Thank you for writing to SILAVU… we will answer you personally");
  - the button reads "Send enquiry" / "שליחת הפנייה", and the form gives way to a thank-you card naming the reader.
- Or put your own form endpoint URL in `data-endpoint=""` on `<form id="cform">` in `src/body.mjs`. The endpoint can be a form service or the house's own server, and must accept a JSON POST. The page then:
  - posts `{ name, city, contact, want, selection, message, lang, page, text }`;
  - shows "Thank you, your enquiry has reached the concierge" **only** when the server answers 2xx;
  - on any failure says so, keeps everything typed, and offers "Continue in email".
- Before switching it on:
  1. Send a test enquiry and confirm it arrives at the business address (concierge@silavu.com).
  2. Update the privacy page (`src/policies.mjs`, "privacy"). It currently says the form opens the reader's own mail app.

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
