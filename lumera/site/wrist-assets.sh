#!/bin/bash
# The SILAVU campaign frames that are composited or cropped at build time, rather than
# shipped as flat files. Run inside the Higgsfield sandbox; writes into the given public/img directory.
set -e
OUT="${1:-app/public/img}"; mkdir -p "$OUT"; T=$(mktemp -d)
B=https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf

# ── the wrist: a watch and the Line worn together, on bare skin, no mark on the body ──
curl -sf -o "$T/w.png" $B/hf_20260917_094621_a0e05ebf-21bc-4613-a68e-ede32b095343.png   # 2752 x 1536
# landscape: tightened around the watch and the bracelet. The frame is wider
# than the screen — it carries a slow parallax scale — so a retina desktop asks
# it for about 3400 device pixels. The old ladder stopped at 1300 and it showed.
# The crop opens to 2560 of the master's 2752 real pixels: still a tightening
# around the watch and the wrist, and nothing here is an upscale.
CROP=2560x1440+96+48
convert "$T/w.png" -crop $CROP +repage -quality 88 -sampling-factor 4:2:0 -strip "$OUT/wrist-2560.jpg"
convert "$T/w.png" -crop $CROP +repage -resize 1900x -quality 87 -sampling-factor 4:2:0 -strip "$OUT/wrist-1900.jpg"
convert "$T/w.png" -crop $CROP +repage -resize 1300x -quality 86 -sampling-factor 4:2:0 -strip "$OUT/wrist-1300.jpg"
convert "$T/w.png" -crop $CROP +repage -resize 900x  -quality 84 -strip "$OUT/wrist-900.jpg"
# portrait: the same frame, cut 4:5 so both the watch and the bracelet survive on a phone
convert "$T/w.png" -crop 1229x1536+899+0 +repage -quality 88 -sampling-factor 4:2:0 -strip "$OUT/wristv-1229.jpg"
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
# ── the monogram collection, worn: the house mark as a necklace, a bracelet and
#    an ear piece, photographed on a body rather than on lacquer ──
curl -sf -o "$T/wneck.png" $B/hf_20260917_235243_65979adf-98d3-4536-a98f-c91303712574.png
curl -sf -o "$T/wwrist.png" $B/hf_20260917_235243_bd09ee75-7834-400c-a2ae-81aabff5e2e2.png
curl -sf -o "$T/wear.png" $B/hf_20260917_235243_82c78547-f0ac-44e2-8321-9a824865f6d1.png
for w in 800 1200 1600 2000; do
  convert "$T/wneck.png"  -resize ${w}x -quality 85 -sampling-factor 4:2:0 -strip "$OUT/mono-neck-$w.jpg"
  convert "$T/wwrist.png" -resize ${w}x -quality 85 -sampling-factor 4:2:0 -strip "$OUT/mono-wrist-$w.jpg"
  convert "$T/wear.png"   -resize ${w}x -quality 85 -sampling-factor 4:2:0 -strip "$OUT/mono-ear-$w.jpg"
done

# ── the same three pieces again, clean on white. These are the second frame of
#    each card: the rail alternates between the piece worn and the piece seen.
#    High-key, so they carry a lighter quality setting without banding. ──
curl -sf -o "$T/pneck.png"  $B/hf_20260918_001929_8d3887b4-8403-482f-b66b-685d91b45581.png
curl -sf -o "$T/pwrist.png" $B/hf_20260918_001929_6800ec99-6515-42ad-ae7c-1a3a4b36d17a.png
curl -sf -o "$T/pear.png"   $B/hf_20260918_001929_cc48496f-9cc5-4d64-bbbf-bf0a76d6ad18.png
for w in 800 1200 1600 2000; do
  convert "$T/pneck.png"  -resize ${w}x -quality 88 -strip "$OUT/mono-neck-p-$w.jpg"
  convert "$T/pwrist.png" -resize ${w}x -quality 88 -strip "$OUT/mono-wrist-p-$w.jpg"
  convert "$T/pear.png"   -resize ${w}x -quality 88 -strip "$OUT/mono-ear-p-$w.jpg"
done

# ── the two one-of-ones, worn. The Desert Star at a throat and the Sapphire of
#    the Gulf on a hand, so every card on the rail has a person in it. ──
curl -sf -o "$T/wstar.png"  $B/hf_20260918_004850_0e602694-e655-4085-bb07-19c896d03f97.png
curl -sf -o "$T/wsapph.png" $B/hf_20260918_004850_2b7884e4-7a2e-4016-9a56-811dbbb49975.png
for w in 800 1200 1600 2000; do
  convert "$T/wstar.png"  -resize ${w}x -quality 85 -sampling-factor 4:2:0 -strip "$OUT/star-worn-$w.jpg"
  convert "$T/wsapph.png" -resize ${w}x -quality 85 -sampling-factor 4:2:0 -strip "$OUT/sapphire-worn-$w.jpg"
done

# ── the rail's closing frame: the pendant worn low on the back ──
curl -sf -o "$T/mback.png" $B/hf_20260918_001929_560c71c5-62fc-4a67-b2be-daff04c70e06.png
for w in 800 1200 1600 2000; do
  convert "$T/mback.png" -resize ${w}x -quality 86 -sampling-factor 4:2:0 -strip "$OUT/mono-back-$w.jpg"
done

# ── the wrist the Line is worn on ────────────────────────────────────────────
# Twelve photographs shot bare for this: a woman's arm and a man's, each in six
# skin tones, no watch and no second bracelet to argue with the piece. The Line
# itself is drawn live on top of them in the browser, so what is worn is the cut,
# the carat, the metal and the wrist size the reader chose.
#
# Each master is 3840x2160. The wide frame is served whole; the phone gets the
# same frame cut SQUARE around the wrist, so the bracelet lands dead centre and
# none of the hand is lost. The crop origin is (wrist centre in px) - 1080, and
# it is why script2's portrait table can carry cx 0.5 for both hands.
WF=https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf
plate() {  # $1 name  $2 hash
  curl -sf -o "$T/$1.png" "$WF/$2.png"
  # The wide plate is padded out to 2:1 with black before it is served. The
  # masters are 16:9 and the fingertips sit 3% below the top edge; a 1.87 canvas
  # covering a 1.78 plate crops 2.5% off the top, which takes the ends of the
  # fingers with it. At 2:1 nothing is ever cropped vertically and the crop
  # falls on the padding instead. It also moves cx, which the table knows.
  convert "$T/$1.png" -background black -gravity center -extent 4320x2160 "$T/$1w.png"
  convert "$T/$1w.png" -resize 1900x -quality 86 -sampling-factor 4:2:0 -strip "$OUT/wrist-$1-1900.jpg"
  convert "$T/$1w.png" -resize 1300x -quality 85 -sampling-factor 4:2:0 -strip "$OUT/wrist-$1-1300.jpg"
  # A phone gets the same frame, smaller. It used to get its own crop, cut
  # square around the arm — and square is taller than any phone's canvas, so
  # cover trimmed the top and bottom and what it trimmed was the ends of the
  # fingers: thirty-five pixels of hand on the top row, measured live at 390.
  # At 2:1 the plate is wider than that canvas at every width it is given, so
  # cover can only ever crop black at the sides.
  convert "$T/$1w.png" -resize 1000x -quality 84 -sampling-factor 4:2:0 -strip "$OUT/wrist-$1-1000.jpg"
}
# The four deepest tones were re-shot. The first pass darkened the exposure
# instead of lighting dark skin: the deepest woman's arm came back at a mean
# of 66 against 133 for the fairest, with its brightest pixels at 94 of 255 —
# an arm that barely separates from a black background. The man's two deepest
# tones came back at exactly the same brightness as each other, so one of the
# swatches did nothing. Re-shot as a campaign lit FOR deep skin, they carry
# the sheen back: her deepest is 73/124 where it was 66/94, and his two now
# differ, 82 and 71. Measured, not judged.
# her hand
plate f0 hf_20260927_100103_10a4aff1-b840-486c-adbc-730ce0021a8c
plate f1 hf_20260927_101321_1c372ae8-9cd7-4c6d-ae7c-85539ea86b90
plate f2 hf_20260927_101330_cfd8f227-55d1-4747-8a77-8783afb4ebef
plate f3 hf_20260927_101337_069e83cd-cb0c-4ec4-b2ab-11efb57ddd00
plate f4 hf_20260927_104527_fb723efe-bee8-4c9c-b9e0-40c745d02120
plate f5 hf_20260927_104536_ad8dd155-c625-4416-986e-3b725ca89a1a
# his hand
plate m0 hf_20260927_101314_036cdff5-eb22-4aea-add1-791534d6b8a1
plate m1 hf_20260927_101459_3c7586db-4210-44d5-9909-b1a4b8363eae
plate m2 hf_20260927_101506_2be26cf0-6ef2-45cf-bedc-5f43e0e66aa1
plate m3 hf_20260927_101513_d4b218cd-fd14-4fa1-936f-5f6d4bb959d8
plate m4 hf_20260927_104544_ff227631-f68a-45e2-bdb8-6f4db5e4e9c0
plate m5 hf_20260927_104555_27c0347f-dbd0-4450-971e-443d2079a4c0

ls -la "$OUT"/wrist*.jpg "$OUT"/mono-*.jpg "$OUT"/craft*.jpg "$OUT"/sigb*.jpg "$OUT"/tennis*.jpg "$OUT"/earsil*.jpg
