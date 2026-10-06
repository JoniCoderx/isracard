# SILAVU administration: architecture

## What exists (audited 6 October 2026)

- **Storefront**: a hand-built static generator in `lumera/site/`.
  - `src/build.mjs` assembles `src/body.mjs`, `src/style.css` and `src/script*.html` into `silavu-page.html`.
  - `gen-static.mjs` writes `dist/`: the English page, the Hebrew page, a page for every piece, About, the policies, the sitemap, robots and 404.
  - GitHub Actions (`.github/workflows/pages.yml`) builds and deploys to GitHub Pages at `https://jonicoderx.github.io/isracard/`.
- **Data already structured**:
  - `src/pieces.mjs`: the products;
  - `src/policies.mjs`: Privacy, Terms and the other documents;
  - `src/about.mjs`: About;
  - `src/pricing.json`: The Line estimate;
  - `lang/{ar,fr,ru}.json`: translations keyed by English.
- **Page copy** lives in `src/body.mjs` as 175 `data-en` / `data-he` pairs, swapped in place by the language switch.
- **Forms**: the enquiry posts to FormSubmit, with `data-to` on `#cform`. WhatsApp and phone are hand-offs.
- **No backend, no analytics, no accounts.**
- The `lumera/` Next.js app and the repository-root game are unrelated to the storefront and are left alone.

## Shape of the system

```
 Admin app (static, /admin/)  ──supabase-js──▶  Supabase
   login, MFA, editors, preview                   Postgres + RLS (all permissions live here)
                                                  Auth (email/password, recovery, TOTP MFA)
 Storefront (static, GitHub Pages)                Storage (private buckets: media, attachments, exports)
   enquiry form ──POST──▶ functions/enquiry       Edge Functions (enquiry, collect, publish,
   tracker     ──POST──▶ functions/collect          release-snapshot, release-status, staff, media,
                                                    export, status)
 Publish ──▶ functions/publish ──repository_dispatch──▶ GitHub Actions
   Actions ──BUILD_TOKEN──▶ functions/release-snapshot   (published content + signed media URLs)
   Actions builds dist with the snapshot, deploys, reports ──▶ functions/release-status
```

### Why this shape

- **Storefront speed and resilience.** The storefront stays static. Published content is baked into the HTML at build time, so:
  - SEO and social previews are in the delivered HTML;
  - a Supabase outage never blanks the site;
  - visitors never download admin code.
- **One content model.** Every editable thing is a *content document* (`content_docs`) with a draft and a published copy.
  - The build reads the published snapshot.
  - The same pure modules (`lumera/site/content/*.mjs`) turn content into markup for both the build and the admin preview, so cards, piece pages, galleries, the configurator summary and enquiries all read one source.
- **Drafts never leave the database.**
  - The public snapshot is assembled from published documents only, by `app.public_snapshot()`, which drops private fields.
  - Media is uploaded to a private bucket and becomes public only when a release bakes it into the static site. A published page and its pictures go live together.
- **Permissions are enforced in Postgres.**
  - A user's role is read from the `staff` table on every request, never from JWT metadata. Changing or revoking a role takes effect on the next request; revoking also deletes the user's sessions.
- **Secrets stay server-side.**
  - The browser only ever sees the Supabase URL and the publishable anon key.
  - The service-role key, the GitHub dispatch token, the build token and the mail key are Supabase function secrets. The build token is also a GitHub Actions secret.

## Publishing and releases

1. *Save draft* writes `content_docs.draft` with a version check, so a stale tab gets a conflict instead of overwriting.
2. *Publish* (owner or editor) calls `publish_docs()`.
   - Drafts are copied to published, revisions are recorded, and a `releases` row is created holding the public snapshot.
   - The `publish` function then sends `repository_dispatch` to GitHub.
3. GitHub Actions:
   - fetches the snapshot and signed media URLs with `BUILD_TOKEN`;
   - derives image sizes with ImageMagick, builds and deploys;
   - reports `live` or `failed`.
   - A failed build leaves the last good deploy live, because GitHub Pages only swaps on success.
4. Any push of code (not content) builds with the **latest live** snapshot.
   - If the backend is unreachable, it uses the copy already published on the site (`/_content/release.json`, public fields only).
   - With neither, it uses the seed: today's site.
5. *Restore*:
   - a document revision becomes a new draft revision;
   - an old release can be re-published as a new release.
   - Both are audited.

## Roles (enforced by RLS and by the security-definer functions)

| Role | Can |
| --- | --- |
| owner | everything, staff, security, exports, restore |
| editor | content, products, media, publish |
| support | enquiries, customers, quotes |
| analyst | aggregated analytics only |

## Analytics

- First-party and allowlisted.
- Collection depends on the visitor's consent, which is required by default.
- No fingerprinting, no form contents, no query strings other than permitted `utm_*`.
- Admin traffic is excluded.
- Aggregation runs in SQL.

See `ADMIN_SETUP.md` for setup and `ADMIN_GUIDE.md` for daily use.
