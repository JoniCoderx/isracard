#!/bin/bash
# The Collection photography. The originals are committed under media/, so the
# site never depends on an outside host for the pieces themselves; this only
# derives the widths the page asks for. Run inside CI; writes into public/img.
set -e
OUT="${1:-dist/img}"; mkdir -p "$OUT"
# Every piece with committed originals derives the same way. The folder name is
# the piece's prefix, the leading digit in a filename is only there to hold the
# gallery's order on disk, and the rest is the shot's role.
# All of it is shot at 1254 square, so 1254 is the largest honest width.
for SRC in "$(dirname "$0")"/media/*/; do
  piece=$(basename "$SRC")
  # originals arrive in whatever the render wrote; they are not re-encoded here
  ls "$SRC"/*.webp "$SRC"/*.png >/dev/null 2>&1 || continue
  for f in "$SRC"/*.webp "$SRC"/*.png; do
    [ -f "$f" ] || continue
    n=$(basename "$f"); n=${n%.*}; n=${n#${piece}-}; n=${n#[0-9]-}
    for w in 640 900 1254; do
      convert "$f" -resize ${w}x${w} -quality 88 -strip "$OUT/$piece-$n-$w.jpg"
    done
  done
  echo "$piece: $(ls "$SRC"/*.webp "$SRC"/*.png 2>/dev/null | wc -l) shots"
done
ls "$OUT"/knot-*.jpg "$OUT"/ring-*.jpg "$OUT"/necklace-*.jpg 2>/dev/null | wc -l
