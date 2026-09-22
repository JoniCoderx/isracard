#!/bin/bash
# The Collection photography. The originals are committed under media/, so the
# site never depends on an outside host for the pieces themselves; this only
# derives the widths the page asks for. Run inside CI; writes into public/img.
set -e
OUT="${1:-dist/img}"; SRC="$(dirname "$0")/media/knot"; mkdir -p "$OUT"
# shot at 1254 square, so 1254 is the largest honest width
for f in "$SRC"/*.webp; do
  n=$(basename "$f" .webp); n=${n#knot-}; n=${n#[0-9]-}
  for w in 640 900 1254; do
    convert "$f" -resize ${w}x${w} -quality 88 -strip "$OUT/knot-$n-$w.jpg"
  done
done
ls -la "$OUT"/knot-*.jpg | head -20
