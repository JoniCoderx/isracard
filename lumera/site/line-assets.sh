#!/bin/bash
# The Line's real photograph: the bracelet the drawing turns into. One master,
# shot on black at 21:9, derived at the widths the canvas asks for. Its near
# black is taken to true black so it sits on the page with no visible edge.
set -e
OUT="${1:-dist/img}"; mkdir -p "$OUT"
B="https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf"
SRC="hf_20261001_235801_42780124-d305-4d33-a0d1-f194711f5b1c.png"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
curl -fsSL --retry 4 --retry-delay 3 --retry-all-errors --connect-timeout 15 --max-time 180 -o "$T/m.png" "$B/$SRC"
for w in 1200 2000 3200; do
  convert "$T/m.png" -level 4%,100% -resize "${w}x" -quality 88 -sampling-factor 4:2:0 -strip "$OUT/line-real-$w.jpg"
done
ls -la "$OUT"/line-real-*.jpg
