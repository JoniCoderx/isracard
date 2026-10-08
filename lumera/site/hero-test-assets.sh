#!/bin/bash
# The candidate hero film for the /test/ page ("The Cloche": the three pieces
# under a glass cloche in a Dubai salon at night, the necklace taken out),
# made natively in 4K (Kling 3.0, 4K mode) from the approved opening still.
# The whole take is used: she lifts the cloche and takes the necklace all the
# way up; then it plays in reverse to where it began, so every
# turn of the loop meets itself without a jump. The frames are laid out once in
# that order and each size is cut from them, so nothing is held in memory.
#   dist/v/hero-cloche-4k.mp4 (2160, large screens on fast connections),
#   dist/v/hero-cloche.mp4 (1080),
#   dist/v/hero-cloche-v.mp4 (phones: only the upright slice a phone shows,
#     cut from the 4K frames at full detail, 1216x2160),
#   dist/img/hero-cloche-{1600,1920,2560,3840}.jpg and
#   dist/img/hero-cloche-v-{1080,1216}.jpg (the first frame)
# Needs ffmpeg. Usage: hero-test-assets.sh <dist dir>
set -e
OUT="${1:-dist}"; mkdir -p "$OUT/v" "$OUT/img"
B=https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf
SRC=$B/hf_20261008_171734_9df192f2-d222-4e15-ba2d-a15691102e61.mp4
T=$(mktemp -d)
curl -fsSL --retry 4 --retry-delay 3 --retry-all-errors -o "$T/src.mp4" "$SRC"
# every frame of the take, at 24 fps
END=$(ffmpeg -nostdin -v error -i "$T/src.mp4" -vf fps=24 -f null - -progress pipe:1 | awk -F= '/^frame=/ { n = $2 } END { print n }')
mkdir "$T/f" "$T/seq"
ffmpeg -nostdin -v error -i "$T/src.mp4" -an -vf "fps=24,scale=3840:2160:flags=lanczos,setsar=1" -frames:v $END -q:v 1 "$T/f/%04d.jpg"
n=0
for i in $(seq 1 $END) $(seq $((END - 1)) -1 2); do
  n=$((n + 1)); ln -s "$T/f/$(printf %04d $i).jpg" "$T/seq/$(printf %04d $n).jpg"
done
for spec in "3840 2160 24 hero-cloche-4k" "1920 1080 23 hero-cloche"; do
  set -- $spec
  ffmpeg -nostdin -v error -framerate 24 -i "$T/seq/%04d.jpg" -an -vf "scale=$1:$2:flags=lanczos,setsar=1,format=yuv420p" \
    -c:v libx264 -preset slow -crf $3 -profile:v high -pix_fmt yuv420p -movflags +faststart "$OUT/v/$4.mp4" -y
  echo "$4: $(( $(stat -c%s "$OUT/v/$4.mp4") / 1024 ))KB"
done
# the phone's slice: 9:16 of the 4K frame, anchored where the phone page looks (42% across)
VX=$(( (3840 - 1216) * 42 / 100 / 2 * 2 ))
ffmpeg -nostdin -v error -framerate 24 -i "$T/seq/%04d.jpg" -an -vf "crop=1216:2160:$VX:0,setsar=1,format=yuv420p" \
  -c:v libx264 -preset slow -crf 24 -profile:v high -pix_fmt yuv420p -movflags +faststart "$OUT/v/hero-cloche-v.mp4" -y
echo "hero-cloche-v: $(( $(stat -c%s "$OUT/v/hero-cloche-v.mp4") / 1024 ))KB"
for w in 1080 1216; do
  ffmpeg -nostdin -v error -i "$T/f/0001.jpg" -vf "crop=1216:2160:$VX:0,scale=$w:-2:flags=lanczos" -q:v 2 "$OUT/img/hero-cloche-v-$w.jpg" -y
done
for w in 1600 1920 2560 3840; do
  ffmpeg -nostdin -v error -i "$T/f/0001.jpg" -vf "scale=$w:-2:flags=lanczos" -q:v 2 "$OUT/img/hero-cloche-$w.jpg" -y
done
rm -rf "$T"
