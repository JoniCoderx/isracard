#!/bin/bash
# The box sequence, cut from the 4K restoration.
#
# The frames used to be fetched one by one from the house preview host — 288
# requests every build — and the largest of them was 2560 wide at about 58KB,
# which is a frame that was itself upscaled from something smaller. On a wide
# screen the canvas asked for 3840 and got mush.
#
# This cuts every tier from one Topaz 4K master instead. The master is 16:9,
# but the source was 2560x1428 (1.793), so it is un-stretched back to its own
# geometry first or the box comes out a little tall.
set -e
OUT="${1:-dist/f/box}"; mkdir -p "$OUT"
MASTER="https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf/hf_20260922_131325_f6cc3239-ed1f-477f-91c5-73069a458a92.mp4"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT

if curl -fsSL --retry 3 -o "$T/b.mp4" "$MASTER"; then
  UN="scale=3840:2142:flags=lanczos"                   # un-stretch to the true ratio
  # xx: the wide-screen tier. d and x are cut from the same master, so every
  # tier is a downscale of real detail rather than a re-compression of a guess.
  ffmpeg -nostdin -v error -i "$T/b.mp4" -vf "$UN" -vsync 0 -start_number 0 -c:v libwebp -quality 76 -compression_level 6 -preset picture "$OUT/xx-%02d.webp" -y
  ffmpeg -nostdin -v error -i "$T/b.mp4" -vf "$UN,scale=2560:-2:flags=lanczos" -vsync 0 -start_number 0 -c:v libwebp -quality 80 -compression_level 6 -preset picture "$OUT/x-%02d.webp" -y
  ffmpeg -nostdin -v error -i "$T/b.mp4" -vf "$UN,scale=1920:-2:flags=lanczos" -vsync 0 -start_number 0 -c:v libwebp -quality 80 -compression_level 6 -preset picture "$OUT/d-%02d.webp" -y
  # the phone strip is a tall centre crop of the same frame, 9:16
  ffmpeg -nostdin -v error -i "$T/b.mp4" -vf "$UN,crop=1205:2142:1317:0,scale=1080:1920:flags=lanczos" -vsync 0 -start_number 0 -c:v libwebp -quality 78 -compression_level 6 -preset picture "$OUT/m-%02d.webp" -y
  # the loader asks for -00 first and -95 last; if either is missing the
  # sequence is broken and it is better to fail the build than ship it
  for t in xx x d m; do
    [ -f "$OUT/$t-00.webp" ] && [ -f "$OUT/$t-95.webp" ] || { echo "tier $t is not 00..95" >&2; exit 1; }
    echo "$t: $(ls "$OUT"/$t-*.webp | wc -l) frames, $(du -ck "$OUT"/$t-*.webp | tail -1 | cut -f1)K"
  done
  du -sh "$OUT"
else
  echo "4K master unreachable — falling back to the published frames" >&2
  B=https://silavu-house.higgsfield.app/f/box
  for s in d m x; do for n in $(seq -w 0 95); do curl -fsSL --retry 2 -o "$OUT/$s-$n.jpg" "$B/$s-$n.jpg" || true; done; done
fi
