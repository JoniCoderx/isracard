# Download a Google Fonts css2 stylesheet and its woff2 files into a folder, rewriting the URLs
# to local ones. Usage: gfetch.py <css2 url> <out dir> <css file name> [subsets to keep, comma list]
import sys, re, os, subprocess, hashlib
url, out, name = sys.argv[1], sys.argv[2], sys.argv[3]
keep = set(sys.argv[4].split(",")) if len(sys.argv) > 4 and sys.argv[4] else None
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
os.makedirs(out, exist_ok=True)
css = subprocess.run(["curl", "-sS", "-A", UA, url], capture_output=True, text=True, check=True).stdout
blocks = re.findall(r"/\* ([\w-]+) \*/\s*(@font-face \{[^}]*\})", css)
if not blocks: blocks = [("all", b) for b in re.findall(r"@font-face \{[^}]*\}", css)]
res = []
for subset, b in blocks:
    if keep and subset not in keep: continue
    fam = re.search(r"font-family: '([^']+)'", b).group(1); st = re.search(r"font-style: (\w+)", b).group(1)
    u = re.search(r"url\((https://[^)]+)\)", b).group(1)
    fn = (fam.lower().replace(" ", "-") + "-" + st + "-" + subset + "-" + hashlib.sha1(u.encode()).hexdigest()[:6] + ".woff2")
    p = os.path.join(out, fn)
    if not os.path.exists(p): subprocess.run(["curl", "-sS", "-A", UA, "-o", p, u], check=True)
    res.append(b.replace(u, fn))
open(os.path.join(out, name), "w").write("\n".join(res) + "\n")
print(name, len(res), "faces,", sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out) if f.endswith(".woff2")) // 1024, "KB in", out)
