#!/bin/bash
# The Line at night: tennis bracelets on a black car, Dubai behind. A 4K master
# (3848x2152, 6 s, 145 frames) cut into 96 frames per tier, the same tiers and
# names the box uses, so the page's sequence engine scrubs it the same way.
set -e
OUT="${1:-dist/f/bench}"; mkdir -p "$OUT"
MASTER="https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf/hf_20260930_161448_1e1e31f9-9439-43f8-844f-4f267f0ffa4d.mp4"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
curl -fsSL --retry 3 -o "$T/b.mp4" "$MASTER"
# 96 frames spread evenly over the clip
PICK="fps=96/6.04,setpts=N/FRAME_RATE/TB"
ffmpeg -nostdin -v error -i "$T/b.mp4" -vf "$PICK,scale=3840:-2:flags=lanczos" -frames:v 96 -vsync 0 -start_number 0 -c:v libwebp -quality 74 -compression_level 6 -preset picture "$OUT/xx-%02d.webp" -y
ffmpeg -nostdin -v error -i "$T/b.mp4" -vf "$PICK,scale=2560:-2:flags=lanczos" -frames:v 96 -vsync 0 -start_number 0 -c:v libwebp -quality 78 -compression_level 6 -preset picture "$OUT/x-%02d.webp" -y
ffmpeg -nostdin -v error -i "$T/b.mp4" -vf "$PICK,scale=1920:-2:flags=lanczos" -frames:v 96 -vsync 0 -start_number 0 -c:v libwebp -quality 78 -compression_level 6 -preset picture "$OUT/d-%02d.webp" -y
# the phone strip: a 9:16 centre crop, 900 wide like the box's
ffmpeg -nostdin -v error -i "$T/b.mp4" -vf "$PICK,crop=1210:2152:1319:0,scale=900:1600:flags=lanczos" -frames:v 96 -vsync 0 -start_number 0 -c:v libwebp -quality 70 -compression_level 6 -preset picture "$OUT/m-%02d.webp" -y
for t in xx x d m; do
  [ -f "$OUT/$t-00.webp" ] && [ -f "$OUT/$t-95.webp" ] || { echo "tier $t did not come out as 00..95" >&2; exit 1; }
  echo "$t: $(ls "$OUT"/$t-*.webp | wc -l) frames, $(du -ck "$OUT"/$t-*.webp | tail -1 | cut -f1)K"
done
