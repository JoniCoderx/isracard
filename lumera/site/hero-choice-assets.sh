#!/bin/bash
# The white hero film on trial on /test3/ ("The Choice", 18 Oct 2026): the
# four pieces on white marble, her hand lifting the SOUL necklace, then the
# necklace at her throat. Two takes made natively in 4K (Kling 3.0, 4K mode)
# from the approved stills; the first starts a second in, the second follows
# it through a short dissolve, and that first second closes the loop, so every
# turn of the loop meets itself without a jump. The takes are 24 fps; the
# film is given at 60. About half an hour of work in 4K, so the workflow keeps
# the result and only makes it again when this file changes.
#   dist/v/hero-choice-4k.mp4 (2160, large screens on fast connections),
#   dist/v/hero-choice.mp4 (1080),
#   dist/v/hero-choice-v.mp4 (phones: an upright slice of each take, cut at
#     the 4K frame's full height and kept at 1080x1920),
#   dist/img/hero-choice-{1600,1920,2560,3840}.jpg and
#   dist/img/hero-choice-v-{1080,1216}.jpg (the first frame)
# Needs ffmpeg. Usage: hero-choice-assets.sh <dist dir>
set -e
OUT="${1:-dist}"; mkdir -p "$OUT/v" "$OUT/img"
B=https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf
T=$(mktemp -d)
curl -fsSL --retry 4 --retry-delay 3 --retry-all-errors -o "$T/a.mp4" "$B/hf_20261018_142411_dbf42758-6945-40fa-9e80-b2aa70eb1dce.mp4"
curl -fsSL --retry 4 --retry-delay 3 --retry-all-errors -o "$T/b.mp4" "$B/hf_20261018_142413_05133951-ac27-43e1-adfd-fa123efe2dee.mp4"
frames() { ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$1"; }
NA=$(frames "$T/a.mp4"); NB=$(frames "$T/b.mp4")
# lengths in frames at 24 fps: the first second of the first take (HEAD) is
# held back for the end, the takes meet over MID frames
HEAD=24; MID=14
LA=$((NA - HEAD))
O1=$(awk -v n=$((LA - MID)) 'BEGIN { printf "%.4f", n / 24 }')
O2=$(awk -v n=$((LA + NB - MID - HEAD)) 'BEGIN { printf "%.4f", n / 24 }')
DM=$(awk -v n=$MID 'BEGIN { printf "%.4f", n / 24 }'); DH=$(awk -v n=$HEAD 'BEGIN { printf "%.4f", n / 24 }')
# $1, $2: the filter each take goes through first; $3: the result's name.
# $4, $5: the takes, if not the two as they came
cut() {
  ffmpeg -nostdin -v error -i "${4:-$T/a.mp4}" -i "${5:-$T/b.mp4}" -filter_complex "\
[0:v]fps=24,$1,split[a][h];[a]trim=start_frame=$HEAD,setpts=PTS-STARTPTS[a1];[h]trim=end_frame=$HEAD,setpts=PTS-STARTPTS[a0];\
[1:v]fps=24,$2,setpts=PTS-STARTPTS[b1];\
[a1][b1]xfade=transition=fade:duration=$DM:offset=$O1[ab];[ab][a0]xfade=transition=fade:duration=$DH:offset=$O2,format=yuv420p[o]" \
    -map "[o]" -an -c:v libx264 -preset slow -crf 12 -pix_fmt yuv420p "$3" -y
}
WIDE="scale=-2:2160:flags=lanczos,crop=3840:2160,setsar=1"
cut "$WIDE" "$WIDE" "$T/wide24.mp4"
# the phone's slices: 1500 px of the 3852 px frame, around her hand and the
# pieces in the first take, the pendant and her lips in the second. A slice
# that wide is shorter than a phone, so it sits at the top and the take
# itself, blurred, carries on below it, under the words; the pendant stays
# above the headline instead of behind it.
slice() {
  ffmpeg -nostdin -v error -i "$1" -filter_complex "[0:v]split[s][g];\
[g]crop=1500:2152:$2:0,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=60[bg];\
[s]crop=1500:2152:$2:0,scale=1080:-2:flags=lanczos,format=yuva420p,geq=lum='p(X,Y)':cb='p(X,Y)':cr='p(X,Y)':a='if(lt(Y,H-260),255,255*(H-Y)/260)'[fg];\
[bg][fg]overlay=0:0,setsar=1,format=yuv420p[o]" -map "[o]" -an -c:v libx264 -preset fast -crf 10 "$3" -y
}
slice "$T/a.mp4" 1350 "$T/a-tall.mp4"
slice "$T/b.mp4" 1800 "$T/b-tall.mp4"
cut "null" "null" "$T/tall24.mp4" "$T/a-tall.mp4" "$T/b-tall.mp4"
# 60 fps: the frames between the takes' own 24 are drawn by motion
# interpolation. It works on one core, so the loop is cut in four and the
# pieces drawn side by side ($3 at a time: in 4K each takes some 2.6 GB, and
# four of them with their encoders ran a 16 GB machine out of memory); each
# piece reads past its end (the last one reads the loop's first frames
# again), so the seams, and the loop's own, have their in-between frames too;
# it reads three frames past, as the interpolation holds back its last two. 24 frames make 60, so the pieces start on even frames. A piece that
# fails stops the whole film.
to60() {
  local n=$(frames "$1") i s e k cuts pids=()
  cuts=(0 $(( n / 4 / 2 * 2 )) $(( n / 2 / 2 * 2 )) $(( n * 3 / 4 / 2 * 2 )) $n)
  : > "$T/list.txt"
  for i in 0 1 2 3; do
    s=${cuts[$i]}; e=${cuts[$((i + 1))]}; k=$(( (e - s) * 5 / 2 ))
    ffmpeg -nostdin -v error -stream_loop 1 -i "$1" -an -vf "trim=start_frame=$s:end_frame=$((e + 3)),setpts=PTS-STARTPTS,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,trim=end_frame=$k,setpts=PTS-STARTPTS" \
      -c:v libx264 -preset fast -crf 10 -pix_fmt yuv420p "$T/p$i.mp4" -y &
    pids+=($!)
    echo "file '$T/p$i.mp4'" >> "$T/list.txt"
    if [ ${#pids[@]} -ge "$3" ]; then for p in "${pids[@]}"; do wait "$p"; done; pids=(); fi
  done
  for p in "${pids[@]}"; do wait "$p"; done
  ffmpeg -nostdin -v error -f concat -safe 0 -i "$T/list.txt" -c copy "$2" -y
  [ "$(frames "$2")" -eq $(( n * 5 / 2 )) ] || { echo "$2: wrong length" >&2; exit 1; }
}
to60 "$T/wide24.mp4" "$T/wide.mp4" 2
to60 "$T/tall24.mp4" "$T/tall.mp4" 4
for spec in "3840 2160 23 hero-choice-4k" "1920 1080 22 hero-choice"; do
  set -- $spec
  ffmpeg -nostdin -v error -i "$T/wide.mp4" -an -vf "scale=$1:$2:flags=lanczos,setsar=1,format=yuv420p" \
    -c:v libx264 -preset slow -crf $3 -profile:v high -pix_fmt yuv420p -movflags +faststart "$OUT/v/$4.mp4" -y
  echo "$4: $(( $(stat -c%s "$OUT/v/$4.mp4") / 1024 ))KB"
done
ffmpeg -nostdin -v error -i "$T/tall.mp4" -an -vf "format=yuv420p" \
  -c:v libx264 -preset slow -crf 22 -maxrate 5000k -bufsize 10000k -profile:v high -level 4.2 -pix_fmt yuv420p -movflags +faststart "$OUT/v/hero-choice-v.mp4" -y
echo "hero-choice-v: $(( $(stat -c%s "$OUT/v/hero-choice-v.mp4") / 1024 ))KB"
ffmpeg -nostdin -v error -i "$T/wide.mp4" -frames:v 1 -q:v 1 "$T/first.jpg" -y
ffmpeg -nostdin -v error -i "$T/tall.mp4" -frames:v 1 -q:v 1 "$T/first-v.jpg" -y
for w in 1600 1920 2560 3840; do
  ffmpeg -nostdin -v error -i "$T/first.jpg" -vf "scale=$w:-2:flags=lanczos" -q:v 2 "$OUT/img/hero-choice-$w.jpg" -y
done
for w in 1080 1216; do
  ffmpeg -nostdin -v error -i "$T/first-v.jpg" -vf "scale=$w:-2:flags=lanczos" -q:v 2 "$OUT/img/hero-choice-v-$w.jpg" -y
done
rm -rf "$T"
