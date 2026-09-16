#!/bin/bash
# The wrist photographs for the live "on a wrist" view: two SILAVU campaign frames (bare wrist on black silk), cropped tight around the wrist.
# Run inside the Higgsfield sandbox at build time; writes into the given public/img directory.
set -e
OUT="${1:-app/public/img}"; mkdir -p "$OUT"; T=$(mktemp -d)
B=https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf
curl -sf -o "$T/h.png" $B/hf_20260916_001924_f23b892d-1995-426f-99e1-5ceb48fbdee5.png
curl -sf -o "$T/v.png" $B/hf_20260916_001924_6340a4bf-4665-4afa-ae6b-7d2cf625bb40.png
# the house mark, in the skin: the exact official path, never redrawn, laid into the inner forearm
INK="$(dirname "$0")/mark-ink.png"
if [ -f "$INK" ]; then
  # landscape: the inner forearm, following the arm's tilt
  convert "$INK" -background none -alpha on -channel A -evaluate multiply 0.60 +channel -resize x118 -blur 0x0.7 -rotate -6 "$T/ink-h.png"
  convert "$T/h.png" "$T/ink-h.png" -geometry +1190+840 -compose multiply -composite "$T/h2.png"
  # portrait: the same mark, smaller and turned with the wrist
  convert "$INK" -background none -alpha on -channel A -evaluate multiply 0.58 +channel -resize x104 -blur 0x0.7 -rotate 8 "$T/ink-v.png"
  convert "$T/v.png" "$T/ink-v.png" -geometry +560+980 -compose multiply -composite "$T/v2.png"
else
  cp "$T/h.png" "$T/h2.png"; cp "$T/v.png" "$T/v2.png"
fi
# landscape: wrist centred at (0.52, 0.46), half-width 0.20 of the height
convert "$T/h2.png" -crop 1300x731+790+488 +repage -resize 1300x -quality 86 -sampling-factor 4:2:0 -strip "$OUT/wrist-1300.jpg"
convert "$T/h2.png" -crop 1300x731+790+488 +repage -resize 900x -quality 84 -strip "$OUT/wrist-900.jpg"
# portrait: wrist centred at (0.51, 0.60), half-width 0.227 of the width
convert "$T/v2.png" -crop 900x1125+481+714 +repage -resize 900x -quality 86 -sampling-factor 4:2:0 -strip "$OUT/wristv-900.jpg"
convert "$T/v2.png" -crop 900x1125+481+714 +repage -resize 600x -quality 84 -strip "$OUT/wristv-600.jpg"
# the bench: a setter's hands and one stone, 4:5
curl -sf -o "$T/c.png" $B/hf_20260916_094125_01ad1700-93dd-4171-bee1-87995cc6a52d.png
for w in 800 1200 1600 2000; do convert "$T/c.png" -resize ${w}x -quality 84 -sampling-factor 4:2:0 -strip "$OUT/craft-$w.jpg"; done
# the Signature Chain: the photographs of the piece
curl -sf -o "$T/sigb.png" $B/hf_20260916_115749_d0cfd8ed-6e93-43e9-9149-27394a9bc153.png
curl -sf -o "$T/sigbd.png" $B/hf_20260916_115748_31bb2a98-04e5-460e-898d-f81d37b61ed0.png
for w in 800 1200 1600 2000; do
  convert "$T/sigb.png"  -resize ${w}x -quality 84 -sampling-factor 4:2:0 -strip "$OUT/sigb-$w.jpg"
  convert "$T/sigbd.png" -resize ${w}x -quality 84 -sampling-factor 4:2:0 -strip "$OUT/sigbd-$w.jpg"
done
ls -la "$OUT"/wrist*.jpg "$OUT"/craft*.jpg "$OUT"/sigb*.jpg
