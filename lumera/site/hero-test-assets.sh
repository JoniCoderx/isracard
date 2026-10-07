#!/bin/bash
# The candidate hero film for the /test/ page ("The Cloche": the three pieces
# under a glass cloche in a Dubai salon at night, the necklace taken out).
# Looped: the film starts 1.2 s in, and its last 1.2 s dissolve into those
# first 1.2 s, so the end flows back into the beginning without a jump. The
# still the page opens on is the loop's first frame.
#   dist/v/hero-cloche.mp4 (1080), dist/v/hero-cloche-720.mp4 (phones),
#   dist/img/hero-cloche-1600.jpg, dist/img/hero-cloche-1920.jpg
# Needs ffmpeg. Usage: hero-test-assets.sh <dist dir>
set -e
OUT="${1:-dist}"; mkdir -p "$OUT/v" "$OUT/img"
SRC=https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf/hf_20261007_153305_f8d8ee04-f4d2-4c74-8670-082abc4c8572.mp4
T=$(mktemp -d)
curl -fsSL --retry 4 --retry-delay 3 --retry-all-errors -o "$T/src.mp4" "$SRC"
X=1.2; D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$T/src.mp4")
OFF=$(awk "BEGIN { printf \"%.3f\", $D - 2 * $X - 0.05 }")
for spec in "1920 1080 21 hero-cloche" "1280 720 24 hero-cloche-720"; do
  set -- $spec
  ffmpeg -nostdin -v error -i "$T/src.mp4" -an -filter_complex \
    "[0:v]fps=24,scale=$1:$2:flags=lanczos,setsar=1,split[a][b];[a]trim=start=$X,setpts=PTS-STARTPTS[m];[b]trim=end=$X,setpts=PTS-STARTPTS[h];[m][h]xfade=transition=fade:duration=$X:offset=$OFF,format=yuv420p" \
    -c:v libx264 -preset slow -crf $3 -profile:v high -pix_fmt yuv420p -movflags +faststart "$OUT/v/$4.mp4" -y
  echo "$4: $(( $(stat -c%s "$OUT/v/$4.mp4") / 1024 ))KB"
done
for w in 1600 1920; do
  ffmpeg -nostdin -v error -i "$OUT/v/hero-cloche.mp4" -frames:v 1 -vf "scale=$w:-2:flags=lanczos" -q:v 2 "$OUT/img/hero-cloche-$w.jpg" -y
done
rm -rf "$T"
