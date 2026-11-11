"""Membuat ilustrasi Lottie bermerek AP Insight (lapisan "core sample") ke public/lottie/.

    python scripts/gen-lottie.py
"""
import json
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "lottie")
os.makedirs(OUT, exist_ok=True)

def rgb(h):
    h = h.lstrip("#")
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)] + [1]

CYAN, VANILLA, SANDY, BRICK, CERULEAN = "#3b8ea5", "#f5ee9e", "#f49e4c", "#ab3428", "#2d728f"
EASE = {"i": {"x": [0.16], "y": [1]}, "o": {"x": [0.7], "y": [0]}}

def kf(frames):
    """frames: [(t, value_list)] → animated property"""
    ks = []
    for t, v in frames:
        ks.append({"t": t, "s": v, **EASE})
    return {"a": 1, "k": ks}

def static(v):
    return {"a": 0, "k": v}

def transform(p=(0, 0), a=(0, 0), s=None, o=None, r=0):
    return {
        "o": o or static(100), "r": static(r), "p": static(list(p)) if not isinstance(p, dict) else p,
        "a": static(list(a)), "s": s or static([100, 100]),
    }

def rect_layer(name, x, y, w, h, color, radius, ip, op, scale=None, pos=None, opacity=None, stroke=None, dash=False):
    items = [{"ty": "rc", "d": 1, "s": static([w, h]), "p": static([0, 0]), "r": static(radius), "nm": "r"}]
    if stroke:
        st = {"ty": "st", "c": static(rgb(stroke)), "o": static(100), "w": static(3), "lc": 2, "lj": 2, "nm": "s"}
        if dash:
            st["d"] = [{"n": "d", "nm": "dash", "v": static(8)}, {"n": "g", "nm": "gap", "v": static(6)}]
        items.append(st)
    else:
        items.append({"ty": "fl", "c": static(rgb(color)), "o": static(100), "r": 1, "nm": "f"})
    items.append({"ty": "tr", **transform(), "sk": static(0), "sa": static(0)})
    return {
        "ddd": 0, "ty": 4, "nm": name, "sr": 1, "ip": ip, "op": op, "st": 0, "bm": 0,
        "ks": {
            "o": opacity or static(100), "r": static(0),
            "p": pos or static([x, y]), "a": static([-w / 2, 0]) if scale else static([0, 0]),
            "s": scale or static([100, 100]),
        },
        "shapes": [{"ty": "gr", "it": items, "nm": name}],
    }

def save(name, w, h, op, layers):
    data = {"v": "5.9.0", "fr": 60, "ip": 0, "op": op, "w": w, "h": h, "nm": name, "ddd": 0, "assets": [], "layers": layers}
    with open(os.path.join(OUT, f"{name}.json"), "w") as f:
        json.dump(data, f, separators=(",", ":"))

# 1) Loader — logo SIG: chevron memantul, huruf terisi menyapu kiri → kanan lalu terhapus. Loop ±1,7 detik.
# Path logo dari design/logo/sig/paths.json (hasil trace.py). Huruf diberi class "lt-ink" agar warnanya mengikuti tema (globals.css).
import re
SIG = json.load(open(os.path.join(os.path.dirname(__file__), "..", "design", "logo", "sig", "paths.json")))

def svg_to_shapes(d):
    """Path SVG (M/L/C/Z absolut) → daftar item Lottie 'sh'."""
    shapes = []
    for sub in re.findall(r"M[^M]*", d):
        nums = [float(x) for x in re.findall(r"-?\d+\.?\d*", sub)]
        cmds = re.findall(r"[MLCZ]", sub)
        v, i_, o_ = [], [], []
        k = 0
        pt = lambda: [nums[k], nums[k + 1]]
        for c in cmds:
            if c == "M":
                v.append(pt()); i_.append([0, 0]); o_.append([0, 0]); k += 2
            elif c == "L":
                v.append(pt()); i_.append([0, 0]); o_.append([0, 0]); k += 2
            elif c == "C":
                c1 = [nums[k], nums[k + 1]]; c2 = [nums[k + 2], nums[k + 3]]; e = [nums[k + 4], nums[k + 5]]; k += 6
                p0 = v[-1]
                o_[-1] = [c1[0] - p0[0], c1[1] - p0[1]]
                v.append(e); i_.append([c2[0] - e[0], c2[1] - e[1]]); o_.append([0, 0])
        if len(v) > 1 and abs(v[0][0] - v[-1][0]) < 1e-6 and abs(v[0][1] - v[-1][1]) < 1e-6:
            i_[0] = i_[-1]; v.pop(); i_.pop(); o_.pop()
        shapes.append({"ty": "sh", "ks": static({"i": i_, "o": o_, "v": v, "c": True})})
    return shapes

def sig_layer(name, d, color, cls=None, opacity=100, pos=None, mask=None, ip=0, op=100):
    items = svg_to_shapes(d) + [{"ty": "fl", "c": static(rgb(color)), "o": static(100), "r": 2}, {"ty": "tr", **transform(), "sk": static(0), "sa": static(0)}]
    layer = {"ddd": 0, "ty": 4, "nm": name, "sr": 1, "ip": ip, "op": op, "st": 0, "bm": 0,
             "ks": {"o": static(opacity), "r": static(0), "p": pos or static([PADX, PADY]), "a": static([0, 0]), "s": static([100, 100])},
             "shapes": [{"ty": "gr", "it": items, "nm": name}]}
    if cls: layer["cl"] = cls
    if mask: layer["hasMask"] = True; layer["masksProperties"] = [mask]
    return layer

LW, LH = SIG["w"], SIG["h"]
PADX, PADY = 28, 56
FR = 100
def rect_path(l, r):
    return {"i": [[0, 0]] * 4, "o": [[0, 0]] * 4, "v": [[l, -20], [r, -20], [r, LH + 20], [l, LH + 20]], "c": True}
sweep = {"inv": False, "mode": "a", "o": static(100), "x": static(0), "nm": "sweep", "pt": {"a": 1, "k": [
    {"t": 0, "s": [rect_path(0, 0)], **EASE}, {"t": 55, "s": [rect_path(0, LW)], **EASE},
    {"t": 78, "s": [rect_path(0, LW)], **EASE}, {"t": 98, "s": [rect_path(LW, LW)], **EASE}, {"t": 100, "s": [rect_path(LW, LW)]}]}}
bounce = kf([(0, [PADX, PADY]), (26, [PADX, PADY - 22]), (44, [PADX, PADY + 3]), (60, [PADX, PADY]), (100, [PADX, PADY])])
layers = [
    sig_layer("chevron", SIG["red"], "#F03340", pos=bounce),
    sig_layer("letters-fill", SIG["dark"], "#0A0A0A", cls="lt-ink", mask=sweep),
    sig_layer("letters-ghost", SIG["dark"], "#0A0A0A", cls="lt-ink", opacity=22),
]
save("loader", LW + PADX * 2, LH + PADY + 40, FR, layers)

# 2) Sukses unggah — lapisan tersusun lalu tanda centang tergambar.
def check_layer(ip, op):
    path = {"ty": "sh", "ks": static({"i": [[0, 0], [0, 0], [0, 0]], "o": [[0, 0], [0, 0], [0, 0]], "v": [[-22, 0], [-6, 16], [24, -18]], "c": False})}
    trim = {"ty": "tm", "s": static(0), "e": kf([(ip, [0]), (ip + 30, [100])]), "o": static(0), "m": 1}
    st = {"ty": "st", "c": static(rgb("#ffffff")), "o": static(100), "w": static(9), "lc": 2, "lj": 2}
    return {
        "ddd": 0, "ty": 4, "nm": "check", "sr": 1, "ip": 0, "op": op, "st": 0, "bm": 0,
        "ks": {"o": static(100), "r": static(0), "p": static([100, 92]), "a": static([0, 0]), "s": static([100, 100])},
        "shapes": [{"ty": "gr", "it": [path, trim, st, {"ty": "tr", **transform(), "sk": static(0), "sa": static(0)}]}],
    }

def circle_layer(color, op):
    s = kf([(0, [0, 0]), (24, [108, 108]), (34, [100, 100])])
    items = [{"ty": "el", "d": 1, "s": static([110, 110]), "p": static([0, 0])}, {"ty": "fl", "c": static(rgb(color)), "o": static(100), "r": 1},
             {"ty": "tr", **transform(), "sk": static(0), "sa": static(0)}]
    return {"ddd": 0, "ty": 4, "nm": "disc", "sr": 1, "ip": 0, "op": op, "st": 0, "bm": 0,
            "ks": {"o": static(100), "r": static(0), "p": static([100, 92]), "a": static([0, 0]), "s": s},
            "shapes": [{"ty": "gr", "it": items}]}

success = [check_layer(26, 120), circle_layer(CERULEAN, 120)]
yy = 160
for i, (c, hgt) in enumerate([(VANILLA, 8), (SANDY, 8), (BRICK, 8)]):
    pos = kf([(0, [100, yy + 30]), (14 + i * 6, [100, yy + 30]), (40 + i * 6, [100, yy])])
    op_ = kf([(0, [0]), (14 + i * 6, [0]), (34 + i * 6, [100])])
    success.append(rect_layer(f"s{i}", 0, 0, 110 - i * 20, hgt, c, 4, 0, 120, pos=pos, opacity=op_))
    yy += 12
save("upload-success", 200, 200, 120, success)

# 3) Kosong — lapisan menunggu: lapisan atas putus-putus melayang (belum ada data).
empty = []
float_pos = kf([(0, [100, 58]), (60, [100, 50]), (120, [100, 58])])
empty.append(rect_layer("slot", 0, 0, 120, 22, None, 8, 0, 120, pos=float_pos, stroke=CERULEAN, dash=True))
yy = 92
for i, (c, hgt) in enumerate([(CYAN, 16), (VANILLA, 18), (SANDY, 20), (BRICK, 24)]):
    empty.append(rect_layer(f"e{i}", 0, 0, 120, hgt, c, 6, 0, 120, pos=static([100, yy + hgt / 2]), opacity=static(55 + i * 10)))
    yy += hgt + 6
save("empty", 200, 210, 120, empty)

# 4) Gagal validasi — lapisan retak bergeser.
err = []
yy = 50
for i, (c, hgt) in enumerate([(CYAN, 18), (VANILLA, 20), (SANDY, 22), (BRICK, 26)]):
    dx = (-14 if i % 2 else 14) if i == 2 else 0
    pos = kf([(0, [100, yy + hgt / 2]), (20, [100, yy + hgt / 2]), (30, [100 + dx, yy + hgt / 2]), (36, [100 + dx * 0.7, yy + hgt / 2])])
    err.append(rect_layer(f"x{i}", 0, 0, 120, hgt, c, 6, 0, 90, pos=pos))
    yy += hgt + 6
save("upload-error", 200, 200, 90, err)
print("ok", sorted(os.listdir(OUT)))
