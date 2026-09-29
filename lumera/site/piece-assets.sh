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
# An unmatched glob is not an error, it is nothing. Without this the two
# patterns below are asked of `ls` together, `ls` fails on the one that matched
# nothing, and a folder holding only .webp — which is most of them — is skipped
# in silence. That shipped: the bracelet and the ring had no photography at any
# width on the live site while the build went green.
shopt -s nullglob
rc=0
for SRC in "$(dirname "$0")"/media/*/; do
  piece=$(basename "$SRC")
  # originals arrive in whatever the render wrote; they are not re-encoded here
  files=("$SRC"*.webp "$SRC"*.png)
  if [ ${#files[@]} -eq 0 ]; then
    echo "no originals in media/$piece"; rc=1; continue
  fi
  for f in "${files[@]}"; do
    n=$(basename "$f"); n=${n%.*}; n=${n#${piece}-}; n=${n#[0-9]-}
    for w in 640 900 1254; do
      convert "$f" -resize ${w}x${w} -quality 88 -strip "$OUT/$piece-$n-$w.jpg"
    done
  done
  echo "$piece: ${#files[@]} shots"
done
echo "derived: $(ls "$OUT"/*.jpg 2>/dev/null | wc -l) files"
exit $rc
