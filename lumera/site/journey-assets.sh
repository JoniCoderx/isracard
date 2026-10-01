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
  "1:hf_20261001_144817_8dabc9e2-082d-400c-905b-4df3539ffcba.png"
  "2:hf_20261001_144817_ff169fb6-8602-47fb-a85c-bb898e3a9ead.png"
  "3:hf_20261001_144817_a73de631-6169-400f-987b-3abd93f4a1d2.png"
  "4:hf_20261001_144816_2e1cf9d2-2232-48ea-aaf6-3bb39cff162a.png"
  "5:hf_20261001_144816_2482476f-5c3c-4eba-9232-266cac4ebbb8.png"
  "6:hf_20261001_144816_0251a8c4-85e1-41dc-b473-7148fee1eac9.png"
)
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
rc=0
for e in "${SRC[@]}"; do
  n="${e%%:*}"; f="${e#*:}"
  if curl -fsSL --retry 4 --retry-delay 3 --retry-all-errors --connect-timeout 15 --max-time 180 -o "$T/$n.png" "$B/$f"; then
    # shot at 2400 wide, on white; 2000 is the largest honest width the page asks for
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
