#!/bin/bash
# The SILAVU campaign frames that are composited or cropped at build time, rather than
# shipped as flat files. Run inside the Higgsfield sandbox; writes into the given public/img directory.
set -e
OUT="${1:-app/public/img}"; mkdir -p "$OUT"; T=$(mktemp -d)
B=https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf

# ── the wrist: a watch and the Line worn together, on bare skin, no mark on the body ──
curl -sf -o "$T/w.png" $B/hf_20260917_094621_a0e05ebf-21bc-4613-a68e-ede32b095343.png   # 2752 x 1536
# landscape: tightened around the watch and the bracelet
convert "$T/w.png" -crop 2200x1238+380+180 +repage -resize 1300x -quality 86 -sampling-factor 4:2:0 -strip "$OUT/wrist-1300.jpg"
convert "$T/w.png" -crop 2200x1238+380+180 +repage -resize 900x  -quality 84 -strip "$OUT/wrist-900.jpg"
# portrait: the same frame, cut 4:5 so both the watch and the bracelet survive on a phone
convert "$T/w.png" -crop 1229x1536+899+0 +repage -resize 900x -quality 86 -sampling-factor 4:2:0 -strip "$OUT/wristv-900.jpg"
convert "$T/w.png" -crop 1229x1536+899+0 +repage -resize 600x -quality 84 -strip "$OUT/wristv-600.jpg"

# ── the bench: a setter's hands and one stone, 4:5 ──
curl -sf -o "$T/c.png" $B/hf_20260916_094125_01ad1700-93dd-4171-bee1-87995cc6a52d.png
for w in 800 1200 1600 2000; do convert "$T/c.png" -resize ${w}x -quality 84 -sampling-factor 4:2:0 -strip "$OUT/craft-$w.jpg"; done

# ── the Signature Chain: the piece and its detail ──
curl -sf -o "$T/sigb.png" $B/hf_20260916_115749_d0cfd8ed-6e93-43e9-9149-27394a9bc153.png
curl -sf -o "$T/sigbd.png" $B/hf_20260916_115748_31bb2a98-04e5-460e-898d-f81d37b61ed0.png
for w in 800 1200 1600 2000; do
  convert "$T/sigb.png"  -resize ${w}x -quality 84 -sampling-factor 4:2:0 -strip "$OUT/sigb-$w.jpg"
  convert "$T/sigbd.png" -resize ${w}x -quality 84 -sampling-factor 4:2:0 -strip "$OUT/sigbd-$w.jpg"
done

# ── the two house objects: the Line itself, and the ear piece ──
curl -sf -o "$T/tennis.png" $B/hf_20260917_094621_363c354b-7ee2-422d-98cb-fb069dd59933.png
curl -sf -o "$T/earsil.png" $B/hf_20260917_094621_99456c45-a8df-4208-add7-e5fc3d434a74.png
curl -sf -o "$T/earsil2.png" $B/hf_20260916_143909_8a389748-fb88-49c6-bf1a-63ebdfd610d8.png
for w in 800 1200 1600 2000; do
  convert "$T/tennis.png"  -resize ${w}x -quality 84 -sampling-factor 4:2:0 -strip "$OUT/tennis-$w.jpg"
  convert "$T/earsil.png"  -resize ${w}x -quality 84 -sampling-factor 4:2:0 -strip "$OUT/earsil-$w.jpg"
  convert "$T/earsil2.png" -resize ${w}x -quality 84 -sampling-factor 4:2:0 -strip "$OUT/earsil2-$w.jpg"
done
ls -la "$OUT"/wrist*.jpg "$OUT"/craft*.jpg "$OUT"/sigb*.jpg "$OUT"/tennis*.jpg "$OUT"/earsil*.jpg
