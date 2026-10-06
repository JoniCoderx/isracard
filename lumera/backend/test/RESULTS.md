# Test results

Run on 6 October 2026, on a local Postgres with the real migrations, the real edge functions
(through `test/fake-supabase.mjs`, which stands in only for Supabase's HTTP layer, Auth and
Storage), the real site build, and Chromium. Nothing was sent to any outside service.

| Suite | Command | Result |
|---|---|---|
| Database policies | `npm run test:db` | 16 / 16 pass |
| Edge functions | `npm run test:functions` | 10 / 10 pass |
| Storefront content | `node --test lumera/site/test/content.test.mjs` | 9 / 9 pass |
| Storefront with backend (browser) | `node --test lumera/site/test/backend-storefront.test.mjs` | 5 / 5 pass |
| Acceptance checks 1–15 (browser, site under /isracard/) | `npm run test:acceptance` | 14 / 14 pass (about 6½ minutes) |

Acceptance checks, as named in the run:

- 1 · the owner signs in, recovers access and signs out; visitors and ordinary accounts get nothing
- setup · the owner imports the current site; built from the backend it is the same site
- 3·4·6 · the owner changes a piece, adds and orders photographs, sets a price; the draft stays private; preview; publish; every public view changes
- 2 · each role sees and can do only its part; nobody can raise their own role; removal and a second factor take effect at once; no secret reaches a browser
- 5 · the editor changes hero, footer and About words, orders two text bands, a contact number and adds a page to the menu; published, it reads right on desktop and phone
- 7 · simultaneous edits, a failed upload, a failed publication and a backend that is down all end in a plain, recoverable state
- 8 · a visitor designs a bracelet and sends an enquiry: one record, their design and details, seen by support, a truthful thank-you; a WhatsApp click is counted apart
- 9 · support makes a quote from the enquiry, sends it; editing the product later changes nothing in the quote or the customer's copy
- 10 · visits are counted only with consent, once each, never after a no, never with Global Privacy Control, never from the admin's browser; the analyst sees and filters them
- 11 · the editor takes the oval off The Line and adds a 21 cm wrist: the builder offers exactly that, the server refuses what is no longer offered, and earlier designs keep their shape
- 12 · Hebrew reads right to left on the site (menu, modal, form, prices) and in the admin; English left to right
- 13 · the admin works from the keyboard with labelled controls, dialogs keep focus, layouts hold on a phone, and the storefront is as light as before
- 14 · the admin lives at /isracard/admin/: any screen can be reloaded or bookmarked, back and forward work, emails lead back to it
- 15 · a published price and title reach the search and sharing tags, the structured data and the sitemap; an export restores into an empty backend that builds the same site

## Defects these checks found, and fixed

- Photographs uploaded in the admin were never resized for the live site (an empty field in the
  build's media list shifted the next one). Fixed in `site/library-assets.sh`.
- Password-reset and invitation links only worked in the browser that asked; they now carry a
  one-time token and work from any device.
- Support and analyst accounts could read unpublished drafts. Now owner and editor only.
- The owner could not require a second factor until the person had already set one up.
- With a WhatsApp number set, the form opened WhatsApp instead of saving the enquiry.
- New menu links did not appear on the document pages; a page title showed its \*stars\* in the footer.
- Choosing the same file again after a failed upload did nothing.
- Closing a dialog with Escape could be lost, and focus did not always return to the button that
  opened it.
- The home page's sharing picture could not be changed without code.
- A stale local copy of published content could be reused by a later local build.

## Not testable here

See ADMIN_SETUP.md, section 9: the hosted Supabase project, real email delivery, GitHub's
`repository_dispatch` with a real token, the nightly workflow against a real project, country
detection and the custom domain.
