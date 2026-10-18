#!/bin/bash
# "SOUL, in light" (/test4/, 18 Oct 2026): the frames the scroll plays.
# Three takes made natively in 4K (Kling 3.0) from stills built on the house's
# own SOUL photographs: the necklace turns to face the reader; its pavé
# diamonds lift out of their seats (played forward, then back, so they settle
# again); it comes to rest on white silk. Laid end to end and sampled to N
# frames, cut into three tiers:
#   d-NNN.webp 1920 wide, x-NNN.webp 2560 wide (wide screens; the scroll
#   tiers stop at 2560, motion-taste 3), m-NNN.webp 900x1600 (phones: the
#   pendant whole, a slice of the frame around it, set a little above the
#   middle of the phone with the frame itself, softened, above and below).
# Needs ffmpeg. Usage: soul-frames.sh <out dir>
set -e
OUT="${1:-dist/f/soul}"; mkdir -p "$OUT"
B=https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf
N=120
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
get() { curl -fsSL --retry 4 --retry-delay 3 --retry-all-errors -o "$T/$1.mp4" "$B/$2.mp4"; }
get 1 hf_20261018_194716_9b4cd8a6-28f3-4e0a-b781-6205feccb9b1   # it turns to face you
get 2 hf_20261018_194718_11a47b0f-8512-413a-bb25-a8641e6fccef   # the diamonds lift out
get 3 hf_20261018_195119_691ac8f3-8d46-4411-8f6d-5e9530ce0254   # it comes to rest on silk
# every frame of the four parts, in order, at the takes' own 24 fps
mkdir "$T/f" "$T/all"
for k in 1 2 3; do ffmpeg -nostdin -v error -i "$T/$k.mp4" -vf "fps=24,scale=3840:2160:force_original_aspect_ratio=increase,crop=3840:2160" -q:v 1 "$T/f/$k-%03d.jpg"; done
n=0; add() { n=$((n + 1)); ln -s "$1" "$T/all/$(printf %04d $n).jpg"; }
for f in "$T"/f/1-*.jpg; do add "$f"; done
for f in "$T"/f/2-*.jpg; do add "$f"; done
for f in $(ls "$T"/f/2-*.jpg | sort -r); do add "$f"; done
# the landing is kept to its first 70 frames: after that the pendant begins
# to tip over on the silk, and the mark has to end upright
for f in $(ls "$T"/f/3-*.jpg | head -70); do add "$f"; done
# the pendant's centre in each of the N frames (measured once, from the
# frames themselves, and smoothed); the page uses the same table
IFS=, read -r -a CX < "$(dirname "$0")/soul-cx.txt"
[ "${#CX[@]}" -eq "$N" ] || { echo "soul-cx.txt: ${#CX[@]} values for $N frames" >&2; exit 1; }
# N frames, evenly through the whole
for i in $(seq 0 $((N - 1))); do
  s=$(( 1 + i * (n - 1) / (N - 1) )); f="$T/all/$(printf %04d $s).jpg"; o=$(printf %03d $i)
  ffmpeg -nostdin -v error -i "$f" -vf "scale=1920:-2:flags=lanczos" -c:v libwebp -quality 80 -compression_level 6 "$OUT/d-$o.webp" -y
  ffmpeg -nostdin -v error -i "$f" -vf "scale=2560:-2:flags=lanczos" -c:v libwebp -quality 80 -compression_level 6 "$OUT/x-$o.webp" -y
  # the slice follows the pendant across the frame (soul-cx.txt, its centre
  # in each frame, as a share of the width)
  x0=$(awk -v c="${CX[$i]}" 'BEGIN { x = int(c * 3840 - 1000); if (x < 0) x = 0; if (x > 1840) x = 1840; print x }')
  ffmpeg -nostdin -v error -i "$f" -filter_complex "[0:v]crop=2000:2160:$x0:0,split[a][b];[a]scale=900:1600:force_original_aspect_ratio=increase,crop=900:1600,gblur=sigma=40[bg];[b]scale=900:-2:flags=lanczos,format=yuva420p,geq=lum='p(X,Y)':cb='p(X,Y)':cr='p(X,Y)':a='255*min(1\,min(Y/90\,(H-Y)/90))'[fg];[bg][fg]overlay=0:(H-h)/2-140" -c:v libwebp -quality 76 -compression_level 6 "$OUT/m-$o.webp" -y
done
last=$(printf %03d $((N - 1)))
for t in d x m; do
  [ -f "$OUT/$t-000.webp" ] && [ -f "$OUT/$t-$last.webp" ] || { echo "soul: $t frames missing" >&2; exit 1; }
  echo "$t: $(ls "$OUT"/$t-*.webp | wc -l) frames, $(du -ck "$OUT"/$t-*.webp | tail -1 | cut -f1)K"
done
