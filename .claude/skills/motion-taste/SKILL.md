---
name: motion-taste
description: SILAVU's rules for animation, hover, press feedback, easing, durations and scroll performance on the site (lumera/site). Use before adding or changing any animation, transition, hover effect, scroll-driven sequence, 3D element or interactive component, and when reviewing why something feels slow, laggy or "cheap".
---

# Motion taste for SILAVU

The rules below are adapted from Emil Kowalski's public writing on interface
animation (emilkowal.ski: "7 Practical Animation Tips", "You Don't Need
Animations", "Agents with Taste", "The Magic of Clip Path"), plus what was
measured on this site. They are written strictly on purpose: follow them
rather than inventing new values. When a rule and the owner's own words
disagree, the owner wins.

## 1. Decide whether to animate at all

Every animation needs a purpose. Valid purposes:
- explaining something,
- feedback on a press,
- continuity between two states,
- rare delight.

If none applies, don't animate.

- **Frequency decides.** The more often a reader sees it, the less it should move.
  - Things used many times a session (nav links, list hovers, filters, language menu) get no animation, or a colour change only.
- **Keyboard actions never animate:** Tab focus, Escape closing, arrow keys in a gallery.
- **Delight only where it is seen rarely:** the opening film, the box sequence, the first reveal of the emblem.
- **One focal point per screen.** If two things in the same viewport move at once, remove or quiet one. The QA brief flagged the page for this.
- **Respect `prefers-reduced-motion`:** show the final state, keep the content.

## 2. Values (use these, don't improvise)

### Durations

| What | Duration |
|---|---|
| Press and hover micro-interactions | 100–150ms |
| Tooltips, dropdowns, the language menu, chips | 150–250ms |
| Modals, the piece window, drawers, the menu | 200–300ms |
| Anything else that is interface (not a film or story moment) | under 300ms |

- Exits run about 20% faster than entrances.
- Longer travel takes a little longer. Larger elements are a little slower.
- Marketing story moments (hero, box, section reveals) may be slower, but never block reading or input.

### Easing, chosen in this order

1. Entering or leaving the screen: `ease-out`.
2. Moving or morphing on screen: `ease-in-out`.
3. Hover colour or opacity: `ease`.
4. Constant motion (a loop, a spinner): `linear`.
5. Default: `ease-out`.

Built-in curves are weak. Prefer a custom ease-out such as
`cubic-bezier(.2,.8,.2,1)`, which the site already uses. Never use `ease-in`
for something appearing: it feels slow.

### Scale and origin

- **Press feedback:** `transform: scale(.97)` on `:active`. The site uses `.97` on `.btn`.
- **Never animate from `scale(0)`.** Start at `.93`–`.97`, together with opacity 0. Real objects don't appear from nothing.
- **Popovers scale from their trigger.** Set `transform-origin` to the trigger's side, not `center`.
- **Tooltips:** keep a short delay before the first one. Once one is open, neighbouring ones open instantly, with no animation.

### Fixes for things that feel off

| Problem | Fix |
|---|---|
| Jitter | animate only `transform` / `opacity`; add `will-change: transform` only while animating |
| Hover flicker | animate a child, not the element under the pointer |
| Small tap targets | 44px minimum hit area (a pseudo-element can enlarge it) |
| Still not right | a light blur (about `2px`) during the transition can hide steps |
| Reveal effects | prefer `clip-path: inset(...)` to animating `height`. It is composited and does not shift layout. |
| Image reveal | `inset(0 0 100% 0)` → `inset(0 0 0 0)`, `cubic-bezier(.77,0,.175,1)` |

## 3. Scroll performance (measured on this site, October 2026)

These are not taste. They are why the site lagged on phone, Mac and PC.

- **Never let a picture be unpacked mid-scroll.**
  - Frames drawn to a canvas must be held decoded as `ImageBitmap`s.
  - Create them from the file's bytes: `fetch → blob → createImageBitmap(blob)`. This decodes off the main thread.
  - Do not build them from an already-loaded `<img>`: in Chrome that decodes on the main thread.
  - `img.decode()` alone is not enough for large frames. Chrome may drop the pixels and decode again on draw.
  - Release with `bitmap.close()`.
- **Never build 3D or compile shaders while the reader scrolls.**
  - Fetch libraries when the page is idle.
  - Build geometry and warm shaders only after the reader has stopped scrolling for about 450ms, and only within a few screens of the element.
  - Until then, show the flat version.
- **Scroll-scrubbed sequences:** keep the pin long enough that frames don't have to change faster than they can be shown. Don't shorten it to save page length.
- **Do not raise image weight for "4K".**
  - A 3840×2160 frame is a 33 MB bitmap.
  - Cap scroll sequences at the 2560 tier unless a measured test shows the device keeps up.
  - Quality changes need the owner's approval.
- **Count what runs at once.**
  - Infinite CSS animations, `filter`, `mix-blend-mode`, masks and many `will-change` layers all cost every frame.
  - Stop animations that are off screen or invisible (opacity 0 is not off).
- **Measure before and after.**
  - Use a phone-like test: 4× CPU throttle, mobile network, scroll at about 900px/s with two short reading pauses.
  - Compare frame gaps per section and main-thread long tasks.
  - Report honestly when a result can't be reproduced. The test machine renders 3D in software, so GPU costs there are not representative.

## 4. Typography in motion and copy

- Body text about 65ch.
- Tabular numerals where digits align.
- `…` (one character) for ellipses.
- A little letter-spacing on uppercase labels, never on Hebrew or Arabic (`html[data-ns]`).
- Underline only links.

## 5. How to apply this skill

1. Before writing motion, state its purpose (section 1) in one line. If there is none, don't add it.
2. Use the values in section 2 exactly.
3. For anything scroll-driven, 3D or image-heavy, follow section 3 and measure.
4. Work on a `/test` page first (`heroTest` in `lumera/site/gen-static.mjs`), never straight on the live home page.
5. When reviewing, list each issue as: the element, the rule broken, and the fix.
