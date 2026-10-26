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

# 1) Loader — lapisan mengisi dari kiri, berurutan (segar → dalam), lalu menghilang. Loop 2 detik.
layers = []
bars = [(CYAN, 12), (VANILLA, 16), (SANDY, 20), (BRICK, 26)]
y = 30
for i, (c, hgt) in enumerate(bars):
    d = i * 10
    scale = kf([(0, [0, 100]), (18 + d, [0, 100]), (48 + d, [100, 100]), (92, [100, 100]), (112, [0, 100]), (120, [0, 100])])
    layers.append(rect_layer(f"bar{i}", 30 - 50, y + hgt / 2, 100, hgt, c, 6, 0, 120, scale=scale, pos=static([30, y + hgt / 2])))
    y += hgt + 6
save("loader", 160, 150, 120, list(reversed(layers)))

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
