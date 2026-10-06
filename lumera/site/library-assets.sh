#!/bin/bash
# Library media a release uses: pictures and films the owner uploaded in the
# admin. Originals come over signed links from the backend (content/media.json)
# and are derived exactly like the committed collection photography: three
# widths, never upscaled, never re-coloured. Films get a 1080 and a 720 cut and
# a poster. If a release was taken from the live site instead, the derived
# files are taken from the live site too.
# Usage: library-assets.sh <dist dir>   (needs ImageMagick, ffmpeg, node)
set -e
OUT="${1:-dist}"; mkdir -p "$OUT/img" "$OUT/v"
LIST="$(dirname "$0")/content/media.json"
[ -f "$LIST" ] || { echo "library: nothing to fetch"; exit 0; }
LIVE="${SILAVU_LIVE%/}"
T=$(mktemp -d)
node -e 'for (const m of JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))) console.log([m.id, m.kind || "image", m.live ? "live" : "", m.url || ""].join("\t"))' "$LIST" |
while IFS=$'\t' read -r id kind live url; do
  [[ "$id" =~ ^[0-9a-f-]{36}$ ]] || { echo "library: skipped a malformed id"; continue; }
  if [ -n "$live" ]; then
    for w in 640 900 1254; do curl -fsSL --retry 3 -o "$OUT/img/m-$id-$w.jpg" "$LIVE/img/m-$id-$w.jpg" 2>/dev/null || true; done
    curl -fsSL --retry 3 -o "$OUT/v/m-$id.mp4" "$LIVE/v/m-$id.mp4" 2>/dev/null || rm -f "$OUT/v/m-$id.mp4"
    curl -fsSL --retry 3 -o "$OUT/v/m-$id-720.mp4" "$LIVE/v/m-$id-720.mp4" 2>/dev/null || rm -f "$OUT/v/m-$id-720.mp4"
    continue
  fi
  curl -fsSL --retry 4 --retry-delay 3 -o "$T/$id" "$url"
  if [ "$kind" = "video" ]; then
    ffmpeg -nostdin -v error -i "$T/$id" -an -vf "scale='min(1080,iw)':-2:flags=lanczos" -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -movflags +faststart "$OUT/v/m-$id.mp4" -y
    ffmpeg -nostdin -v error -i "$T/$id" -an -vf "scale='min(720,iw)':-2:flags=lanczos" -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -movflags +faststart "$OUT/v/m-$id-720.mp4" -y
    ffmpeg -nostdin -v error -ss 1 -i "$T/$id" -frames:v 1 -vf "scale='min(1254,iw)':-2:flags=lanczos" -q:v 3 "$OUT/img/m-$id-poster.jpg" -y
  else
    # the first frame only (an animated file is not a photograph), in sRGB, shrunk and never enlarged
    for w in 640 900 1254; do convert "$T/$id[0]" -colorspace sRGB -resize "${w}x${w}>" -quality 88 -strip "$OUT/img/m-$id-$w.jpg"; done
  fi
  echo "library: $id ($kind)"
done
rm -rf "$T"
