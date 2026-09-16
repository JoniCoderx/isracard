#!/bin/bash
# The wrist photographs for the live "on a wrist" view: two SILAVU campaign frames (bare wrist on black silk), cropped tight around the wrist.
# Run inside the Higgsfield sandbox at build time; writes into the given public/img directory.
set -e
OUT="${1:-app/public/img}"; mkdir -p "$OUT"; T=$(mktemp -d)
B=https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf
curl -sf -o "$T/h.png" $B/hf_20260916_001924_f23b892d-1995-426f-99e1-5ceb48fbdee5.png
curl -sf -o "$T/v.png" $B/hf_20260916_001924_6340a4bf-4665-4afa-ae6b-7d2cf625bb40.png
# landscape: wrist centred at (0.52, 0.46), half-width 0.20 of the height
convert "$T/h.png" -crop 1300x731+790+488 +repage -resize 1300x -quality 86 -sampling-factor 4:2:0 -strip "$OUT/wrist-1300.jpg"
convert "$T/h.png" -crop 1300x731+790+488 +repage -resize 900x -quality 84 -strip "$OUT/wrist-900.jpg"
# portrait: wrist centred at (0.51, 0.60), half-width 0.227 of the width
convert "$T/v.png" -crop 900x1125+481+714 +repage -resize 900x -quality 86 -sampling-factor 4:2:0 -strip "$OUT/wristv-900.jpg"
convert "$T/v.png" -crop 900x1125+481+714 +repage -resize 600x -quality 84 -strip "$OUT/wristv-600.jpg"
# the bench: a setter's hands and one stone, 4:5
curl -sf -o "$T/c.png" $B/hf_20260916_094125_01ad1700-93dd-4171-bee1-87995cc6a52d.png
for w in 800 1200 1600 2000; do convert "$T/c.png" -resize ${w}x -quality 84 -sampling-factor 4:2:0 -strip "$OUT/craft-$w.jpg"; done
ls -la "$OUT"/wrist*.jpg "$OUT"/craft*.jpg
