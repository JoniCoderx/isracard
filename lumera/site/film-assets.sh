#!/bin/bash
# The SOUL film: three takes of the necklace (A: out of a black void, B: on a
# black mirror, C: on black satin), joined with slow crossfades into one loop
# that rises out of black and returns to it, so the loop never jumps.
# Writes dist/v/soul-film.mp4 (1080), dist/v/soul-film-720.mp4 (phones) and
# dist/img/soul-film-poster.jpg. Needs ffmpeg. Usage: film-assets.sh <dist dir>
set -e
OUT="${1:-dist}"; mkdir -p "$OUT/v" "$OUT/img"; T=$(mktemp -d)
B=https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf
get() { curl -fsSL --retry 4 --retry-delay 3 --retry-all-errors -o "$2" "$B/$1"; }
get "hf_20261005_213222_38df847e-4621-480e-b933-fb3a8261d651.mp4" "$T/a.mp4"
get "hf_20261005_213104_31c63bef-e80f-46f7-8203-5b66f2e4dc6d.mp4" "$T/b.mp4"
get "hf_20261005_213223_295bbf62-00c3-47d0-a83a-53f5bb358d0a.mp4" "$T/c.mp4"
dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }
DA=$(dur "$T/a.mp4"); DB=$(dur "$T/b.mp4"); DC=$(dur "$T/c.mp4"); X=0.8
calc() { awk "BEGIN { printf \"%.3f\", $1 }"; }
O1=$(calc "$DA - $X"); O2=$(calc "$DA + $DB - 2 * $X"); TOT=$(calc "$DA + $DB + $DC - 2 * $X"); FO=$(calc "$TOT - 0.7")
for spec in "1080 22 soul-film" "720 25 soul-film-720"; do
  set -- $spec
  ffmpeg -nostdin -v error -i "$T/a.mp4" -i "$T/b.mp4" -i "$T/c.mp4" -filter_complex \
    "[0:v]fps=24,scale=$1:$1:flags=lanczos,setsar=1[a];[1:v]fps=24,scale=$1:$1:flags=lanczos,setsar=1[b];[2:v]fps=24,scale=$1:$1:flags=lanczos,setsar=1[c];\
[a][b]xfade=transition=fade:duration=$X:offset=$O1[ab];[ab][c]xfade=transition=fade:duration=$X:offset=$O2,fade=t=in:st=0:d=0.7,fade=t=out:st=$FO:d=0.7[v]" \
    -map "[v]" -an -c:v libx264 -preset slow -crf $2 -profile:v high -pix_fmt yuv420p -movflags +faststart "$OUT/v/$3.mp4" -y
  echo "$3: $(( $(stat -c%s "$OUT/v/$3.mp4") / 1024 ))KB"
done
# the still shown before it plays: the mirror take, lit
ffmpeg -nostdin -v error -ss 3 -i "$T/b.mp4" -frames:v 1 -vf "scale=1080:1080:flags=lanczos" -q:v 3 "$OUT/img/soul-film-poster.jpg" -y
rm -rf "$T"
