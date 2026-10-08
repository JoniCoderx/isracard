#!/bin/bash
# The hero film for /test/ with its pop-out: as she takes the necklace, her
# hands and the necklace pass in front of the headline.
# One file carries both: the film on top, and below it a matte (white where
# her hands and the necklace are, black elsewhere) in the same frame, so the
# page draws the film behind the words and the matted part in front of them
# from the very same picture, and the two can never drift apart.
# The matte was cut once from the take (hero-pop-matte.py) and is fetched
# like the film. Both are laid out forward then back, like the plain loop.
#   dist/v/hero-pop.mp4 (2560x2880, drawn a little closer), dist/v/hero-pop-720.mp4 (1280x1440)
# Needs ffmpeg. Usage: hero-pop-assets.sh <dist dir>
set -e
OUT="${1:-dist}"; mkdir -p "$OUT/v"
B=https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf
FILM=$B/hf_20261008_075615_ce1824c8-4e73-4e08-b7ed-8e0af61c8da5.mp4
MATTE=$B/__MATTE__
T=$(mktemp -d)
curl -fsSL --retry 4 --retry-delay 3 --retry-all-errors -o "$T/film.mp4" "$FILM"
curl -fsSL --retry 4 --retry-delay 3 --retry-all-errors -o "$T/matte.mp4" "$MATTE"
mkdir "$T/c" "$T/m" "$T/sc" "$T/sm"
ffmpeg -nostdin -v error -i "$T/film.mp4" -an -vf "fps=24,scale=2560:1440:flags=lanczos,setsar=1" -q:v 1 "$T/c/%04d.jpg"
ffmpeg -nostdin -v error -i "$T/matte.mp4" -an -vf "fps=24,scale=2560:1440:flags=lanczos,format=gray" "$T/m/%04d.png"
END=$(ls "$T/c" | wc -l); EM=$(ls "$T/m" | wc -l); [ "$EM" -lt "$END" ] && END=$EM
n=0
for i in $(seq 1 $END) $(seq $((END - 1)) -1 2); do
  n=$((n + 1)); f=$(printf %04d $i); g=$(printf %04d $n)
  ln -s "$T/c/$f.jpg" "$T/sc/$g.jpg"; ln -s "$T/m/$f.png" "$T/sm/$g.png"
done
for spec in "2560 1440 22 hero-pop" "1280 720 25 hero-pop-720"; do
  set -- $spec
  ffmpeg -nostdin -v error -framerate 24 -i "$T/sc/%04d.jpg" -framerate 24 -i "$T/sm/%04d.png" -an -filter_complex \
    "[0:v]scale=$1:$2:flags=lanczos,format=yuv420p[a];[1:v]scale=$1:$2:flags=lanczos,format=yuv420p[b];[a][b]vstack,setsar=1" \
    -c:v libx264 -preset slow -crf $3 -profile:v high -pix_fmt yuv420p -movflags +faststart "$OUT/v/$4.mp4" -y
  echo "$4: $(( $(stat -c%s "$OUT/v/$4.mp4") / 1024 ))KB"
done
rm -rf "$T"
