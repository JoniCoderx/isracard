#!/bin/bash
# The atelier hand for the drawn mark: fingertips and a drafting pen on true
# black. One master, cropped to the hand with the nib near its left edge
# (the nib sits at 5.59% across, 59.3% down: script9 places it on the line).
set -e
OUT="${1:-dist/img}"; mkdir -p "$OUT"
B="https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf"
SRC="hf_20261003_224941_3c12972d-d589-487c-a123-572ae27824de.png"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
curl -fsSL --retry 4 --retry-delay 3 --retry-all-errors --connect-timeout 15 --max-time 180 -o "$T/m.png" "$B/$SRC"
convert "$T/m.png" -crop 644x688+380+0 +repage -level 3%,100% "$T/c.png"
for w in 700 1200; do
  convert "$T/c.png" -filter Lanczos -resize "${w}x" -quality 86 -sampling-factor 4:2:0 -strip "$OUT/atelier-hand-$w.jpg"
done
ls -la "$OUT"/atelier-hand-*.jpg
