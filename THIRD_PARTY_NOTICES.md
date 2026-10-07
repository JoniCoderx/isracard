# Licences: fonts, icons and code from others

Checked 7 October 2026. Everything below may be used on a commercial website.

## Fonts

| Font | Used for | Licence | Served from |
|---|---|---|---|
| Jost | Latin text, site and admin | SIL Open Font License 1.1 | this site (`public/fonts/`) |
| Assistant | Hebrew text | SIL Open Font License 1.1 | this site |
| Rubik | Hebrew text, admin | SIL Open Font License 1.1 | this site |
| Urbanist | the SILAVU wordmark letters | SIL Open Font License 1.1 | this site |
| Noto Sans Arabic | the Arabic version | SIL Open Font License 1.1 | Google Fonts |

The OFL allows using, embedding and serving the fonts on a commercial site; the only conditions
that apply here are keeping each font's copyright notice and licence with the font files, and not
selling the fonts on their own. The notices and the full licence text are in
`lumera/site/public/fonts/LICENSES.txt`, published next to the fonts at `/fonts/LICENSES.txt`.

## Icons and images

- The SILAVU symbol and wordmark, the favicon and app icons, the diamond-shape icons in The Line,
  and every other icon on the site and in the admin are drawn as SVG for SILAVU in this
  repository. No icon library or icon font is used.
- The photographs and films are the house's own.

## Code that ships to browsers

| Library | Where | Licence |
|---|---|---|
| Preact 11 | admin | MIT |
| @supabase/supabase-js 2.117 (auth-js, postgrest-js, storage-js, functions-js, realtime-js) | admin | MIT |
| three.js (`vendor/three.module.js`, `vendor/jsm/`) | the earlier prototype at the repository root | MIT |

The storefront's own scripts are written for SILAVU. Build tools (esbuild, PostCSS, cssnano,
terser, Playwright for tests) run only while building and testing; nothing of them is served.
