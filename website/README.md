# SILAVU website

A single page for SILAVU fine jewellery. The brand decisions (colours, fonts,
copy, story beats) live in `../copy/brand-kit.md`. The raw media is in
`../assets/`.

## Run it

```bash
cd website
npm install
npm run dev               # http://localhost:5173
npm run build             # portable static build in dist/ (relative paths)
npx vite preview          # serve the build; never open dist/ through file://
```

## What's on the page

- **The story.** A 12-second film (`public/film.mp4`) plays forwards and
  backwards as the visitor scrolls the five story beats. Over it, a WebGL
  layer of light dust drifts in the Blush and Ice accents (`src/atmosphere.js`,
  `src/particles.js`).
  - The film is loaded as a Blob, so it scrubs on hosts without HTTP Range
    support.
  - Phones, tablets and reduced-motion visitors never download the film or
    three.js. They get one still photograph per beat instead.
- **The knot.** The house mark draws itself once, as a hairline.
- **The collection.** An index of the seven pieces beside a lit vitrine.
  Hover or tap a name to show the piece. "Ask to see" fills in the form.
- **Craft.** The pavé close-up, with three pins that light their notes.
- **Worn.** Four on-model photographs.
- **Details.** Four facts.
- **The viewing.** Two ways to book, then the request form.
- **Footer.**

## Where a visitor's request goes

The form doesn't send anything by itself. It opens the visitor's own email app
with a message to **concierge@silavu.com**, already filled in with their name,
contact, where (Tel Aviv salon, Dubai salon or at home) and the piece. They
press send. Nothing is stored on a server.

## Media

| File | What it is |
|---|---|
| `public/film.mp4` | H.264, 1920×1080, keyframe every 8 frames, no audio, 6.2 MB. Re-encoded from `assets/videos/silavu-film.mp4` |
| `public/img/film-start.jpg` | The film's first frame, the poster while the film loads |
| `public/img/hero.jpg` | The chosen hero still, used as `og:image` |
| `public/img/*-portrait.jpg` | Phone crops of the hero, world and material images |
| `public/img/pieces/*.webp` | Cut-outs of the seven pieces, cleaned of leftover white backdrop |
| `public/img/worn/*.jpg` | The house's on-model photographs |
| `public/fonts/` | Bellefair and Assistant (SIL Open Font License), self-hosted: Latin, Latin-ext, Hebrew |

## Published at

GitHub Pages builds this folder into `/new/` on every push (see
`.github/workflows/pages.yml`): https://jonicoderx.github.io/isracard/new/

The live home page is not touched.
