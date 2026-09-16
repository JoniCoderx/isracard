# The source of the page

`build.mjs` assembles `body.mjs`, `style.css` and the seven scripts into
`lumera/site/silavu-page.html`, which `gen-static.mjs` turns into the
static site the Pages workflow deploys.

    node lumera/site/src/build.mjs

## The Signature Chain

The piece is written in full in `body.mjs` and switched off by one flag:

    export const SIG_LIVE = false;

It stays off until the photography of the piece is approved. The house
will not show a picture of a piece that does not look photographed.

## studio/

`studio/studio.mjs` draws the symbol as platinum and `studio/shoot.mjs`
takes the frames. What it produces is a rendering, not a photograph, so
none of it is shipped; it is kept so the piece can be looked at while the
real photography is commissioned.
