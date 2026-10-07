#!/bin/bash
# The candidate hero film for the /test/ page ("The Cloche": the three pieces
# under a glass cloche in a Dubai salon at night, the necklace taken out).
# Looped forward and back: the film plays, then plays in reverse to where it
# began, so every turn of the loop meets itself without a jump. The still the
# page opens on is the loop's first frame.
#   dist/v/hero-cloche.mp4 (1080), dist/v/hero-cloche-720.mp4 (phones),
#   dist/img/hero-cloche-1600.jpg, dist/img/hero-cloche-1920.jpg
# Needs ffmpeg. Usage: hero-test-assets.sh <dist dir>
set -e
OUT="${1:-dist}"; mkdir -p "$OUT/v" "$OUT/img"
SRC=https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf/hf_20261007_153305_f8d8ee04-f4d2-4c74-8670-082abc4c8572.mp4
T=$(mktemp -d)
curl -fsSL --retry 4 --retry-delay 3 --retry-all-errors -o "$T/src.mp4" "$SRC"
# frames of the take; the reverse leaves out both ends so neither shows twice
NF=$(ffprobe -v error -select_streams v -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "$T/src.mp4")
for spec in "1920 1080 23 hero-cloche" "1280 720 26 hero-cloche-720"; do
  set -- $spec
  ffmpeg -nostdin -v error -i "$T/src.mp4" -an -filter_complex \
    "[0:v]fps=24,scale=$1:$2:flags=lanczos,setsar=1,format=yuv420p,split[f][b];[b]reverse,trim=start_frame=1:end_frame=$((NF - 1)),setpts=PTS-STARTPTS[r];[f][r]concat=n=2:v=1:a=0" \
    -c:v libx264 -preset slow -crf $3 -profile:v high -pix_fmt yuv420p -movflags +faststart "$OUT/v/$4.mp4" -y
  echo "$4: $(( $(stat -c%s "$OUT/v/$4.mp4") / 1024 ))KB"
done
for w in 1600 1920; do
  ffmpeg -nostdin -v error -i "$OUT/v/hero-cloche.mp4" -frames:v 1 -vf "scale=$w:-2:flags=lanczos" -q:v 2 "$OUT/img/hero-cloche-$w.jpg" -y
done
rm -rf "$T"
