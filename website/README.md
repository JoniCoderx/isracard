# SILAVU website

A jewellery-house home page on the structure Messika and Cartier actually
use, built from SILAVU's own films, photographs and published catalogue. The
brand decisions live in `../copy/brand-kit.md`.

## Run it

```bash
cd website
npm install
npm run dev               # http://localhost:5173
npm run build             # portable static build in dist/ (relative paths)
npx vite preview          # serve the build; never open dist/ through file://
```

It is plain HTML, CSS and JavaScript built with Vite. The only library is
Lenis, which smooths wheel scrolling on desktop.

## What's on the page

1. **Announcement bar:** private appointments, "Book now".
2. **Header:**
   - Menu (a side panel) and section links on the left.
   - The logo centred.
   - Appointment and the wish list on the right.
   - It hides while you read down and comes back when you scroll up.
3. **Campaign:** the LUMIÈRE film, full width (16:9 on desktop, 9:16 on
   phones).
4. **Explore the jewellery:** four category tiles that filter the grid.
5. **The collection:** seven creations plus an appointment card.
   - Filter chips sit above the grid.
   - Hovering a card shows the worn photograph.
   - The heart saves a piece to a wish list kept in the visitor's browser.
     The header counts saved pieces and a "Wish list" chip appears.
6. **Quick view:** a side panel with the gallery and thumbnails, reference,
   description, specs and "Book an appointment" (with the piece filled in).
7. **The signature:** the film "The Choice" beside the story of the knot.
8. **PROMISE and BLUSH:** the engagement and eternity rings.
9. **Services and reassurances.**
10. **The SILAVU letter.**
11. **Footer.**

## Where requests go

The appointment panel and the letter both open the visitor's own email app,
with a message to **concierge@silavu.com** already written. Nothing is stored
on a server.

## Films

- Each film loads only when it comes near the screen.
- Only the film in view plays.
- Phones get the 9:16 cuts, about 1 MB each.

## Published at

GitHub Pages builds this folder into `/new/` on every push:
https://jonicoderx.github.io/isracard/new/. The live home page is not touched.
