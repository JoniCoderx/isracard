import json, re
from PIL import Image
O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/ct/"
def lum(c):
    def ch(v):
        v=v/255; return v/12.92 if v<=0.03928 else ((v+0.055)/1.055)**2.4
    return 0.2126*ch(c[0])+0.7152*ch(c[1])+0.0722*ch(c[2])
for it in json.load(open(O+"items.json")):
    m=re.findall(r"[\d.]+", it["color"]); fg=[float(x) for x in m[:3]]; a=float(m[3]) if len(m)>3 else 1
    im=Image.open(O+it["file"]).convert("RGB"); px=list(im.get_flattened_data()) if hasattr(im,"get_flattened_data") else list(im.getdata())
    px.sort(key=lum); worst=px[int(len(px)*0.95)-1] if px else (0,0,0); med=px[len(px)//2]
    fgc=[fg[i]*a+worst[i]*(1-a) for i in range(3)]
    L1,L2=lum(fgc),lum(worst); hi,lo=max(L1,L2),min(L1,L2); cr=(hi+0.05)/(lo+0.05)
    large = it["fs"]>=24 or (it["fs"]>=18.66 and it["fw"]>=700)
    need = 3 if large else 4.5
    print(("OK  " if cr>=need else "LOW ")+f'{it["w"]} {it["lang"]} {it["sel"]:<22} {it["fs"]:.0f}px contrast {cr:.1f} (needs {need}) bg95={worst} median={med}')
