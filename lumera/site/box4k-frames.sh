#!/bin/bash
# The box, made natively in 4K (Kling 3.0, 4K mode) between two 4K stills of
# the same box: closed, then open with the diamonds fallen round it (the lid
# opens and the stones burst up out of the box and spread round it). Tried on
# /test2/ only; the live page keeps f/box.
#
# Every frame of the take is kept — 120 at 24 fps instead of 96 — so the
# scroll moves through it in finer steps, and every tier is a downscale of
# real 4K detail:
#   xx 3840x2160, x 2560x1440, d 1920x1080,
#   m  900x1600 (an upright slice of the 4K frame, around the box)
# Usage: box4k-frames.sh <out dir> [<the live box frames, for a fallback>]
set -e
OUT="${1:-dist/f/box4k}"; LIVE="${2:-dist/f/box}"; mkdir -p "$OUT"
SRC="https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf/hf_20261009_085015_dc67027a-ba9a-40e8-9215-174be1a9da7a.mp4"
N=120
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT

OK=0
if curl -fsSL --retry 4 --retry-delay 3 --retry-all-errors -o "$T/b.mp4" "$SRC"; then
  mkdir "$T/f"
  ffmpeg -nostdin -v error -i "$T/b.mp4" -an -vf "fps=24,scale=3840:2160:flags=lanczos,setsar=1" -frames:v $N -start_number 0 -q:v 1 "$T/f/%03d.jpg"
  if [ -f "$T/f/$(printf %03d $((N - 1))).jpg" ]; then
    # the loader names frames 00..99, then 100..119
    for t in "xx 3840:2160 78" "x 2560:1440 80" "d 1920:1080 80" "m crop=1215:2160:1312:0,scale=900:1600 72"; do
      set -- $t; VF="$2"; case "$VF" in crop*) ;; *) VF="scale=$VF";; esac
      for i in $(seq 0 $((N - 1))); do
        ffmpeg -nostdin -v error -i "$T/f/$(printf %03d $i).jpg" -vf "$VF:flags=lanczos" -c:v libwebp -quality $3 -compression_level 6 -preset picture \
          "$OUT/$1-$(printf %02d $i).webp" -y &
        [ $((i % 8)) = 7 ] && wait
      done
      wait
      echo "$1: $(ls "$OUT"/$1-*.webp | wc -l) frames, $(du -ck "$OUT"/$1-*.webp | tail -1 | cut -f1)K"
    done
    OK=1
    for t in xx x d m; do [ -f "$OUT/$t-00.webp" ] && [ -f "$OUT/$t-$((N - 1)).webp" ] || OK=0; done
  fi
fi

# If the take could not be fetched or cut, the page still asks for 120 frames
# per tier: they are filled from the live 96, so the test page shows the box
# as it is today rather than a hole.
if [ "$OK" != "1" ]; then
  echo "box4k: falling back to the live frames" >&2
  rm -f "$OUT"/*.webp
  for t in xx x d m; do
    for i in $(seq 0 $((N - 1))); do
      j=$(( (i * 95 + (N - 1) / 2) / (N - 1) ))
      cp "$LIVE/$t-$(printf %02d $j).webp" "$OUT/$t-$(printf %02d $i).webp" 2>/dev/null || true
    done
  done
fi
du -sh "$OUT"
