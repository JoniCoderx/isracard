#!/bin/bash
# The six photographs of the journey chapter. They were generated once, against
# the approved bracelet reference, and they live at fixed addresses — the same
# way the box sequence's master does. This only derives the widths the page
# asks for. Run inside CI; writes into dist/img.
#
# Continuity is the whole point of this set: one bracelet, six stages. If any
# of these is ever re-shot, re-shoot the ones either side of it too and check
# the tone of the set together — the chapter fails the moment one frame is
# lit differently from the other five.
set -e
OUT="${1:-dist/img}"; mkdir -p "$OUT"
B="https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf"

# stage : file
SRC=(
  "1:hf_20260929_075828_ebb4ead6-1fc0-430d-b4ed-59ae8bb7272e.png"
  "2:hf_20260929_080301_4c025335-b28c-43ad-adf4-e83556436803.png"
  "3:hf_20260929_080301_2442422d-c7dc-4c36-97ce-c695f6245a69.png"
  "4:hf_20260929_075828_493d0b6f-0b42-40bf-8def-6ac4d72187b3.png"
  "5:hf_20260929_075828_51deb85b-e99d-4242-b734-b265c85df50b.png"
  "6:hf_20260929_075829_c08b7dcd-7aa3-45fa-b04a-9a64723efdf0.png"
)
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
rc=0
for e in "${SRC[@]}"; do
  n="${e%%:*}"; f="${e#*:}"
  if curl -fsSL --retry 4 --retry-delay 3 --retry-all-errors --connect-timeout 15 --max-time 180 -o "$T/$n.png" "$B/$f"; then
    # shot at 2336 wide; 2000 is the largest honest width the page asks for
    for w in 800 1200 1600 2000; do
      convert "$T/$n.png" -resize "${w}x" -quality 86 -strip "$OUT/jn$n-$w.jpg"
    done
  else
    echo "missing: journey stage $n"; rc=1
  fi
done
ls -la "$OUT"/jn*.jpg 2>/dev/null | head -8
du -ch "$OUT"/jn*.jpg 2>/dev/null | tail -1
exit $rc
