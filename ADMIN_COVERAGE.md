# SILAVU: what is on the site, and where it is changed

Architecture and setup: `ADMIN_SETUP.md`. Owner's how-to: `ADMIN_GUIDE.md`.

## How the pieces fit

| Part | Where in the repository | What it does |
|---|---|---|
| Storefront | `lumera/site/` | Static generator. `src/content/seed.mjs` is the site as it was; `src/content/load.mjs` lays the published release over it; `apply.mjs`, `templates.mjs`, `money.mjs` render it (the admin's preview uses the same files). |
| Admin | `lumera/admin/` | Preact app, built into `dist/admin/` by the same workflow. Holds only the public project address and key. |
| Database | `lumera/backend/supabase/migrations/` | Tables, row-level security on every table, roles read from `staff` on every request, an append-only audit trail, drafts / revisions / releases, private storage buckets. |
| Server functions | `lumera/backend/supabase/functions/` | `enquiry`, `collect` (public, rate-limited, origin-checked); `publish`, `staff`, `media`, `export`, `setup`, `status` (staff, role-checked); `release-snapshot`, `release-status`, `maintenance` (build token). |
| Workflows | `.github/workflows/pages.yml`, `maintenance.yml` | Build and deploy the site from the newest good release; nightly backup and housekeeping. |
| Tests | `lumera/backend/test/`, `lumera/site/test/` | Policies, functions, storefront, and the brief's acceptance checks end to end. |

Data flow of a change: admin → `save_draft` (version-checked) → *Publish* → `publish_docs` makes a
release and the `publish` function sends `repository_dispatch` → the workflow calls
`release-snapshot` with the build token → builds, derives photographs, deploys → reports
`release-status` → the admin shows *live*. Anonymous visitors only ever reach the two public
functions; the public site never reads the database.

## Coverage map

| On the site | In the admin | Notes |
|---|---|---|
| Every sentence, label, button and link of the home page (153 texts: header, menu, chapters, piece window, try-on, form, footer) | Pages & text → Page text | English and Hebrew; a link's destination can be changed or the link removed |
| Home chapters (hero, house, inside, craft, collection, macro, The Line, enquire, end) | Pages & text → Home chapters | The six marked chapters can be hidden; the order is the designed sequence and stays fixed |
| Text bands between chapters (title, text, button, picture) | Pages & text → Home chapters → Text bands | Added, ordered, hidden; placed after a chosen chapter |
| Top menu and footer links | Pages & text → Page text (existing) and → Menus (added) | Document pages carry the same menu |
| Moved addresses | Pages & text → Menus → Moved pages | Forwarding pages (GitHub Pages cannot send HTTP redirects) |
| Products: name, kind, line, story, diamonds, delivery and care, figures, specification, reference, category, colour, word, badge | Products → the piece | Card, window, own page and structured data change together |
| Product photographs and film | Products → Photographs & film, from Media | Originals kept untouched; 640/900/1254 derived at publish |
| Prices (on request / set / from), per currency | Products → Price & visibility | Integer minor units; no conversion, no live rates |
| Shown / hidden / archived / order of the collection | Products (drag), Price & visibility, Archive | Hidden pieces leave the sitemap |
| Collection filter categories | Products → Categories | |
| Search title, tab title, subtitle per piece | Products → Search | |
| Home page title and description; sharing picture | Languages & SEO → Search and sharing | Without a chosen picture, the designed og.jpg |
| French, Arabic, Russian | Languages & SEO → Français / العربية / Русский | Missing translations are marked and fall back to English |
| About page words | Pages & text → About | With preview |
| Policies (privacy, terms, warranty, care, authenticity, delivery, accessibility) | Pages & text → Policies | `{{…}}` parts are filled in truthfully by the build |
| New document pages | Pages & text → Pages | Own address, footer link, search tags |
| Contact email, WhatsApp, phone, socials, announcement bar, try-on on/off | Settings | Socials appear only when an address is entered |
| Visit counting mode and retention | Settings → Visit counting (owner) | The privacy page follows the setting |
| The Line: shapes, origins, metals, carats, wrist sizes, defaults, estimate figures and rates | The Line | Checked by the server on every enquiry |
| Enquiries, customers, quotes | Enquiries, Customers, Quotes | Support and owner |
| Team, roles, second factor | Team (owner) | |
| Releases, versions, audit trail, exports | History & backups | |

## Not editable in the admin, on purpose

| What | Why |
|---|---|
| The 3D bracelet, its geometry, stones and lighting; the wrist try-on | Approved design work; only what is *offered* is set in The Line |
| The SILAVU logo and mark | Fixed geometry, never redrawn |
| The box film, hero film and hero photograph, the desk and box frames | Produced assets with their own pipelines (`film-assets.sh`, `box-frames.sh`, `desk-assets.py`) |
| The About portrait | A file in `public/` (replace it there) |
| Fonts, colours, layout | Code |
| The order of the home chapters | A designed sequence; chapters can be hidden, bands added |
