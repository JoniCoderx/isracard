#!/usr/bin/env python3
# Where the pavé of ICON sits on the SILAVU mark (for icon-frames.mjs): the
# exact mark is drawn large, its two interlaced strands are found (the
# crescents and the small wedges stay polished, as on the ring), each strand
# is thinned to its centre line, and stones are laid along that line one
# after another, each as large as the strand is wide at that point, so they
# grow and taper with the strand as they do on the piece.
#   icon-pave.json: [[x, y, r], ...] in the mark's own units (872 x 1000)
# Usage: python3 icon-pave.py <mark.png drawn at 2x>
import sys, json, os
import numpy as np
from PIL import Image
from scipy import ndimage as nd
from collections import deque

img = np.array(Image.open(sys.argv[1]).convert("L")) < 128
K = 2.0
lab, n = nd.label(img)
sizes = nd.sum(img, lab, range(1, n + 1))
strands = [i + 1 for i in np.argsort(sizes)[::-1][:2]]   # the two largest: the strands

def thin(m):
    # Zhang-Suen thinning
    m = m.copy().astype(np.uint8)
    while True:
        changed = False
        for step in (0, 1):
            P = np.pad(m, 1)
            p2, p3, p4, p5 = P[:-2, 1:-1], P[:-2, 2:], P[1:-1, 2:], P[2:, 2:]
            p6, p7, p8, p9 = P[2:, 1:-1], P[2:, :-2], P[1:-1, :-2], P[:-2, :-2]
            nb = [p2, p3, p4, p5, p6, p7, p8, p9]
            B = sum(x.astype(int) for x in nb)
            A = sum(((nb[k] == 0) & (nb[(k + 1) % 8] == 1)).astype(int) for k in range(8))
            if step == 0: c = (p2 * p4 * p6 == 0) & (p4 * p6 * p8 == 0)
            else: c = (p2 * p4 * p8 == 0) & (p2 * p6 * p8 == 0)
            d = (m == 1) & (B >= 2) & (B <= 6) & (A == 1) & c
            if d.any(): m[d] = 0; changed = True
        if not changed: return m.astype(bool)

def longest_path(sk):
    pts = set(zip(*np.where(sk)))
    def nbrs(p):
        y, x = p
        return [(y + dy, x + dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy or dx) and (y + dy, x + dx) in pts]
    def bfs(s):
        prev = {s: None}; q = deque([s]); last = s
        while q:
            u = q.popleft(); last = u
            for v in nbrs(u):
                if v not in prev: prev[v] = u; q.append(v)
        return last, prev
    a, _ = bfs(next(iter(pts)))
    b, prev = bfs(a)
    path = []; u = b
    while u is not None: path.append(u); u = prev[u]
    return path

stones = []
for s in strands:
    m = lab == s
    dt = nd.distance_transform_edt(m)
    sk = thin(m)
    path = longest_path(sk)
    # walk the centre line, a stone each time the distance covered reaches
    # the size of the last stone and the next
    acc, lastR = 1e9, 0
    for k in range(len(path)):
        y, x = path[k]
        if k: acc += np.hypot(y - path[k - 1][0], x - path[k - 1][1])
        r = dt[y, x] * 0.72
        if r < 9: continue          # too thin for a stone (the very tips)
        if acc >= (lastR + r) * 1.06:
            stones.append([round(x / K, 2), round(y / K, 2), round(r / K, 2)]); acc = 0; lastR = r
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icon-pave.json")
json.dump(stones, open(out, "w"))
print(len(stones), "stones", "radius", min(s[2] for s in stones), "-", max(s[2] for s in stones))
