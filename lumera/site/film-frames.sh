#!/bin/bash
# The Dubai film, cut into the frames the page scrubs through — the same shape of
# asset as the box sequence, so it uses the same scroll machinery.
#
#   d  100 frames, the full 1174 x 782 frame as shot, for landscape viewports
#   m   50 frames, a 9:16 window cut around the SILAVU bag and resampled up to
#       720 x 1280 with lanczos, so a phone gets a frame made for a phone: the
#       bag stays the subject, the browser is not left to upscale, and the strip
#       is half the weight because half the frames carry a ten-second push-in
#       perfectly well.
#
# 300 source frames: every third for d, every sixth for m. Numbered from 00.
set -e
SRC="${1:-lumera/site/media/silavu-film.mp4}"
OUT="${2:-dist/f/film}"
mkdir -p "$OUT"
ffmpeg -v error -i "$SRC" -vf "select='not(mod(n\,3))'" \
  -vsync 0 -start_number 0 -q:v 6 "$OUT/d-%02d.jpg" -y
ffmpeg -v error -i "$SRC" -vf "select='not(mod(n\,6))',crop=440:782:367:0,scale=720:1280:flags=lanczos" \
  -vsync 0 -start_number 0 -q:v 5 "$OUT/m-%02d.jpg" -y
d=$(ls "$OUT"/d-*.jpg | wc -l); m=$(ls "$OUT"/m-*.jpg | wc -l)
echo "film frames: d=$d m=$m  $(du -sh "$OUT" | cut -f1)"
[ "$d" = "100" ] && [ "$m" = "50" ]
