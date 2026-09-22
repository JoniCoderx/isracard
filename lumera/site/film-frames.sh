#!/bin/bash
# The Dubai film, cut into the frames the page scrubs through.
#
# The master is a Topaz 4K restoration of the original clip. It genuinely carries
# new detail — measured against a plain lanczos enlargement of the same frame, the
# edge energy is roughly double — which is the whole point: the original is only
# 1174 px wide and a full-screen section was enlarging it two and a half times.
#
# One wrinkle. The upscaler has no 3:2 among its output ratios, so "auto" snapped
# the 3:2 source to 4:3 and stretched it to get there. No padding, no crop — a
# pure vertical stretch, which un-stretches exactly: 2880x2160 back to 2880x1920.
#
# Three tiers, WebP throughout (half the bytes of JPEG at the same quality here):
#   x  75 frames, 2200 px wide — large and retina desktops
#   d  75 frames, 1600 px wide — ordinary desktops
#   m  50 frames, 888 x 1920, cut to the shape of a phone screen (9:19.5, which
#      is what a 390x844 or 430x932 actually is) so the browser has nothing left
#      to crop — what is cut is cut here, deliberately, around the SILAVU bag
#
# 300 source frames: every fourth for the desktop strips, every sixth for the phone.
set -e
OUT="${2:-dist/f/film}"
FALLBACK="${1:-lumera/site/media/silavu-film.mp4}"
MASTER=https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf/hf_20260917_114646_cd468399-6712-459e-bfaf-e71119a9d52c.mp4
T=$(mktemp -d); mkdir -p "$OUT"

# the 4K master, un-stretched back to the geometry it was shot at
if curl -fsSL --retry 3 -o "$T/4k.mp4" "$MASTER"; then
  SRC="$T/4k.mp4"; FIX="scale=2880:1920"
  echo "film: 4K master"
else
  # the build still produces a film if the master is unreachable, just a softer one
  SRC="$FALLBACK"; FIX="scale=2880:1920:flags=lanczos"
  echo "film: FALLBACK to the committed master (4K fetch failed)"
fi

ffmpeg -v error -i "$SRC" -vf "select='not(mod(n\,4))',${FIX},scale=2200:-2:flags=lanczos" \
  -vsync 0 -start_number 0 -c:v libwebp -quality 80 -compression_level 6 -preset picture "$OUT/x-%02d.webp" -y
ffmpeg -v error -i "$SRC" -vf "select='not(mod(n\,4))',${FIX},scale=1600:-2:flags=lanczos" \
  -vsync 0 -start_number 0 -c:v libwebp -quality 80 -compression_level 6 -preset picture "$OUT/d-%02d.webp" -y
# the phone strip was 888x1920 at quality 78 and came to 2.5MB across fifty
# frames. A 390pt screen draws it into 780 device pixels, so most of that width
# was never seen; 820 wide at 72 is the same picture at half the bytes.
ffmpeg -v error -i "$SRC" -vf "select='not(mod(n\,6))',${FIX},crop=888:1920:996:0,scale=820:-2:flags=lanczos" \
  -vsync 0 -start_number 0 -c:v libwebp -quality 72 -compression_level 6 -preset picture "$OUT/m-%02d.webp" -y

x=$(ls "$OUT"/x-*.webp | wc -l); d=$(ls "$OUT"/d-*.webp | wc -l); m=$(ls "$OUT"/m-*.webp | wc -l)
echo "film frames: x=$x d=$d m=$m"
du -sh "$OUT"; for t in x d m; do printf "  %s: %s\n" "$t" "$(du -ch "$OUT"/$t-*.webp | tail -1 | cut -f1)"; done
[ "$x" = "75" ] && [ "$d" = "75" ] && [ "$m" = "50" ]
