# SILAVU website

A single white page for SILAVU fine jewellery, built from the house's own films
and photographs. The brand decisions live in `../copy/brand-kit.md`.

## Run it

```bash
cd website
npm install
npm run dev               # http://localhost:5173
npm run build             # portable static build in dist/ (relative paths)
npx vite preview          # serve the build; never open dist/ through file://
```

No libraries: plain HTML, CSS and about 5 KB of JavaScript, built with Vite.

## What's on the page

1. **Header:** the sections, the logo centred, "Book an appointment".
2. **The opening:** the house film "The Choice" as a muted loop, then SOUL.
3. **Intro:** the knot mark and one sentence.
4. **SOUL and BLUSH:** two large pictures, worn.
5. **The collection:** a rail of eight pieces with arrows. Hovering shows the
   piece worn. "Book a viewing" fills in the form.
6. **In motion:** the LUMIÈRE film, tall, beside its words.
7. **The house:** The knot, and Signed.
8. **The appointment:** services and the request form.
9. **Footer.**

## How the films play

- **The right cut for the screen:**
  - Desktop gets `v/hero-choice.mp4` (1080p, 3.2 MB).
  - Phones get the 9:16 cuts, 720 px wide, about 1 MB each.
- **Loading:** a film loads only when it comes within a screen of view.
- **Playing:** only the film most in view plays, and the rest pause.
- **Reduced motion:** visitors who ask for it see the posters.

## Where a visitor's request goes

The form opens the visitor's own email app with a message to
**concierge@silavu.com**, already filled in with their name, contact, salon
and piece. They press send. Nothing is stored on a server.

## Published at

GitHub Pages builds this folder into `/new/` on every push:
https://jonicoderx.github.io/isracard/new/. The live home page is not touched.
