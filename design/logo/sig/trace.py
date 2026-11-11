"""Vektorisasi logo SIG dari gambar sumber -> design/logo/sig/{dark,red}.json (path d, koordinat viewBox 0 0 W H)."""
import json, sys, numpy as np
from PIL import Image
import potrace
SRC = sys.argv[1]
X0, Y0, X1, Y1 = 484, 212, 1068, 552   # crop logo, tanpa teks perusahaan
S = 4
im = Image.open(SRC).convert("RGB").crop((X0, Y0, X1, Y1))
im = im.resize((im.width * S, im.height * S), Image.LANCZOS)
a = np.array(im).astype(int)
masks = {"dark": a.sum(2) < 330, "red": (a[:, :, 0] > 170) & (a[:, :, 1] < 150) & (a[:, :, 0] - a[:, :, 1] > 80)}
out = {"w": X1 - X0, "h": Y1 - Y0}
for k, m in masks.items():
    bm = potrace.Bitmap(~m)
    pl = bm.trace(turdsize=20, alphamax=0.9, opticurve=True, opttolerance=0.4)
    d = []
    f = lambda p: f"{p.x / S:.2f} {p.y / S:.2f}"
    for c in pl:
        d.append(f"M{f(c.start_point)}")
        for s in c.segments:
            if s.is_corner: d.append(f"L{f(s.c)}L{f(s.end_point)}")
            else: d.append(f"C{f(s.c1)} {f(s.c2)} {f(s.end_point)}")
        d.append("Z")
    out[k] = "".join(d)
json.dump(out, open("design/logo/sig/paths.json", "w"))
print(out["w"], out["h"], len(out["dark"]), len(out["red"]))
for k in ("dark", "red"):
    pass
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {out["w"]} {out["h"]}"><path d="{out["red"]}" fill="#F03340"/><path d="{out["dark"]}" fill="#0A0A0A" fill-rule="evenodd"/></svg>'
open("design/logo/sig/sig-mark.svg", "w").write(svg)
