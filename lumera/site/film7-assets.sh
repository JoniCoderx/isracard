#!/bin/bash
# The chapters of /test7/: five takes the house already has (made 18 Oct 2026
# for the LUMIÈRE and "The Choice" films), each cut as a loop of its own, so
# the page is told in real footage only. A take's last 0.6 s dissolves into its
# first, so the loop never jumps.
#   public/v7/<take>.mp4    wide screens, 1920x1080
#   public/v7/<take>-v.mp4  phones, 1080x1920: an upright slice of the 4K frame,
#                           centred on the piece
#   public/v7/<take>.jpg, <take>-v.jpg  the first frame, shown until the film plays
# Takes: marble (the pieces on white marble, her hand lifts SOUL), throat (SOUL
# at her throat, white shirt), skin (SOUL close on skin), silk (her, in black
# silk), hand (her hand: the ICON ring and the MOMENT bracelet).
# Needs ffmpeg. Usage: film7-assets.sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd); OUT="$HERE/public/v7"; mkdir -p "$OUT"
B=https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf
T=$(mktemp -d)
# name, source take, where the piece is across the 4K frame (for the phone slice)
TAKES="marble:hf_20261018_142411_dbf42758-6945-40fa-9e80-b2aa70eb1dce:0.60
throat:hf_20261018_142413_05133951-ac27-43e1-adfd-fa123efe2dee:0.61
skin:hf_20261018_181512_6431633d-7b79-4b42-a737-bdf25adc2076:0.48
silk:hf_20261018_181310_a622e56e-4856-450c-8ad9-b888c908be2a:0.53
hand:hf_20261018_181514_6fb8bd63-2d3b-4a7e-9b35-89adbf56b8b3:0.57"
X=0.6
for t in $TAKES; do
  IFS=: read -r name src cx <<< "$t"
  curl -fsSL --retry 4 --retry-delay 3 --retry-all-errors -o "$T/$name.mp4" "$B/$src.mp4"
  D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$T/$name.mp4")
  O=$(awk -v d="$D" -v x=$X 'BEGIN { printf "%.3f", d - 2 * x }')
  # the loop: the take from X on, its first X seconds dissolving in at the end
  loop="fps=24,split[m][h];[m]trim=start=$X,setpts=PTS-STARTPTS[m1];[h]trim=end=$X,setpts=PTS-STARTPTS[h1];[m1][h1]xfade=transition=fade:duration=$X:offset=$O"
  ffmpeg -nostdin -v error -i "$T/$name.mp4" -filter_complex "[0:v]scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,setsar=1,$loop,format=yuv420p[o]" \
    -map "[o]" -an -c:v libx264 -preset slow -crf 22 -profile:v high -pix_fmt yuv420p -movflags +faststart "$OUT/$name.mp4" -y
  ffmpeg -nostdin -v error -i "$T/$name.mp4" -filter_complex "[0:v]crop=ih*9/16:ih:iw*$cx-ih*9/32:0,scale=1080:1920:flags=lanczos,setsar=1,$loop,format=yuv420p[o]" \
    -map "[o]" -an -c:v libx264 -preset slow -crf 24 -profile:v high -pix_fmt yuv420p -movflags +faststart "$OUT/$name-v.mp4" -y
  ffmpeg -nostdin -v error -i "$OUT/$name.mp4" -frames:v 1 -q:v 3 "$OUT/$name.jpg" -y
  ffmpeg -nostdin -v error -i "$OUT/$name-v.mp4" -frames:v 1 -q:v 3 "$OUT/$name-v.jpg" -y
  echo "$name: $(( $(stat -c%s "$OUT/$name.mp4") / 1024 ))KB / $(( $(stat -c%s "$OUT/$name-v.mp4") / 1024 ))KB"
done
rm -rf "$T"
