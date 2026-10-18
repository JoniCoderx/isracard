#!/bin/bash
# The opening film on trial on /test3/ ("LUMIÈRE", 18 Oct 2026): the SOUL
# pendant on her skin in extreme close-up, her in black silk turning into
# the light, then her hand with the ICON ring and the MOMENT bracelet. Three
# takes made natively in 4K (Kling 3.0, 4K mode) from the approved stills,
# joined by short dissolves; the first take's first half second closes the
# loop, so every turn of the loop meets itself without a jump. Kept at the
# takes' own 24 fps: 4K at 60 stalled on screens that could not decode it.
#   dist/v/hero-lumiere-4k.mp4 (2160, large screens on fast connections),
#   dist/v/hero-lumiere.mp4 (1080),
#   dist/v/hero-lumiere-v.mp4 (phones: an upright slice of each take, at the
#     4K frame's full height, 1080x1920),
#   dist/img/hero-lumiere-{1600,1920,2560,3840}.jpg and
#   dist/img/hero-lumiere-v-{1080,1216}.jpg (the first frame)
# Needs ffmpeg. Usage: hero-lumiere-assets.sh <dist dir>
set -e
OUT="${1:-dist}"; mkdir -p "$OUT/v" "$OUT/img"
B=https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf
T=$(mktemp -d)
get() { curl -fsSL --retry 4 --retry-delay 3 --retry-all-errors -o "$T/$1.mp4" "$B/$2.mp4"; }
get 1 hf_20261018_181512_6431633d-7b79-4b42-a737-bdf25adc2076   # the pendant, close
get 2 hf_20261018_181310_a622e56e-4856-450c-8ad9-b888c908be2a   # her, in black silk
get 3 hf_20261018_181514_6fb8bd63-2d3b-4a7e-9b35-89adbf56b8b3   # her hand, ring and bracelet
frames() { ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$1"; }
N1=$(frames "$T/1.mp4"); N2=$(frames "$T/2.mp4"); N3=$(frames "$T/3.mp4")
# in frames at 24 fps: HEAD frames of the first take are kept for the end,
# the takes meet over MID frames
HEAD=12; MID=10
sec() { awk -v n=$1 'BEGIN { printf "%.4f", n / 24 }'; }
L1=$((N1 - HEAD))
O1=$(sec $((L1 - MID))); O2=$(sec $((L1 + N2 - 2 * MID))); O3=$(sec $((L1 + N2 + N3 - 2 * MID - HEAD)))
DM=$(sec $MID); DH=$(sec $HEAD)
# $1 $2 $3: the filter each take goes through first; $4: the result; $5:
# the takes' own names, if not 1, 2 and 3
cut() {
  local p="${5:-}"
  ffmpeg -nostdin -v error -i "$T/${p}1.mp4" -i "$T/${p}2.mp4" -i "$T/${p}3.mp4" -filter_complex "\
[0:v]fps=24,$1,split[a][h];[a]trim=start_frame=$HEAD,setpts=PTS-STARTPTS[a1];[h]trim=end_frame=$HEAD,setpts=PTS-STARTPTS[a0];\
[1:v]fps=24,$2,setpts=PTS-STARTPTS[b];[2:v]fps=24,$3,setpts=PTS-STARTPTS[c];\
[a1][b]xfade=transition=fade:duration=$DM:offset=$O1[ab];[ab][c]xfade=transition=fade:duration=$DM:offset=$O2[abc];\
[abc][a0]xfade=transition=fade:duration=$DH:offset=$O3,format=yuv420p[o]" \
    -map "[o]" -an -c:v libx264 -preset slow -crf 12 -pix_fmt yuv420p "$4" -y
  [ "$(frames "$4")" -eq $((N1 + N2 + N3 - 2 * MID - HEAD)) ] || { echo "$4: wrong length" >&2; exit 1; }
}
WIDE="scale=3840:2160:force_original_aspect_ratio=increase:flags=lanczos,crop=3840:2160,setsar=1"
cut "$WIDE" "$WIDE" "$WIDE" "$T/wide.mp4"
# the phone's slices, 1500 px of the 3856 px frame: the pendant, then her
# neck and the pendant, then her hand with the ring and the bracelet. A slice
# that wide is shorter than a phone, so it sits at the top and the take
# itself, blurred, carries on below it, under the words; the pendant stays
# above the headline instead of behind it.
slice() {
  ffmpeg -nostdin -v error -i "$T/$1.mp4" -filter_complex "[0:v]fps=24,split[s][g];\
[g]crop=1500:ih:$2:0,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=60[bg];\
[s]crop=1500:ih:$2:0,scale=1080:-2:flags=lanczos,format=yuva420p,geq=lum='p(X,Y)':cb='p(X,Y)':cr='p(X,Y)':a='if(lt(Y,H-260),255,255*(H-Y)/260)'[fg];\
[bg][fg]overlay=0:0,setsar=1,format=yuv420p[o]" -map "[o]" -an -c:v libx264 -preset fast -crf 10 "$T/v$1.mp4" -y
}
slice 1 1178; slice 2 1602; slice 3 1950
cut "null" "null" "null" "$T/tall.mp4" v
for spec in "3840 2160 24 hero-lumiere-4k" "1920 1080 23 hero-lumiere"; do
  set -- $spec
  ffmpeg -nostdin -v error -i "$T/wide.mp4" -an -vf "scale=$1:$2:flags=lanczos,setsar=1,format=yuv420p" \
    -c:v libx264 -preset slow -crf $3 -profile:v high -pix_fmt yuv420p -movflags +faststart "$OUT/v/$4.mp4" -y
  echo "$4: $(( $(stat -c%s "$OUT/v/$4.mp4") / 1024 ))KB"
done
ffmpeg -nostdin -v error -i "$T/tall.mp4" -an -vf "format=yuv420p" \
  -c:v libx264 -preset slow -crf 23 -maxrate 3000k -bufsize 6000k -profile:v high -level 4.1 -pix_fmt yuv420p -movflags +faststart "$OUT/v/hero-lumiere-v.mp4" -y
echo "hero-lumiere-v: $(( $(stat -c%s "$OUT/v/hero-lumiere-v.mp4") / 1024 ))KB"
ffmpeg -nostdin -v error -i "$T/wide.mp4" -frames:v 1 -q:v 1 "$T/first.jpg" -y
ffmpeg -nostdin -v error -i "$T/tall.mp4" -frames:v 1 -q:v 1 "$T/first-v.jpg" -y
for w in 1600 1920 2560 3840; do
  ffmpeg -nostdin -v error -i "$T/first.jpg" -vf "scale=$w:-2:flags=lanczos" -q:v 2 "$OUT/img/hero-lumiere-$w.jpg" -y
done
for w in 1080 1216; do
  ffmpeg -nostdin -v error -i "$T/first-v.jpg" -vf "scale=$w:-2:flags=lanczos" -q:v 2 "$OUT/img/hero-lumiere-v-$w.jpg" -y
done
rm -rf "$T"
