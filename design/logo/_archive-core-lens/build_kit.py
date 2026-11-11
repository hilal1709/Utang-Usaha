"""Membangun logo kit AP Insight "Core Lens" (SVG murni, tanpa <text>).

    python -I design/logo/build_kit.py

Konstruksi simbol: lingkaran r=104 di kanvas 256 (margin 24), dipotong tiga celah horizontal.
Lapisan di bawah tutup atas makin tebal ke bawah (34 → 40 → 44) = umur utang yang makin dalam.
Potongan kecil (≤ 32 px): tiga lapisan, celah 18 agar tidak menutup di 16 px.
Wordmark: Geist SemiBold (OFL) dikonversi ke path, kerning dirapatkan, titik "i" diganti
persegi membulat berwarna Sandy (ditarik dari skala umur).
"""
import math
import os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.recordingPen import DecomposingRecordingPen

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "final")
os.makedirs(OUT, exist_ok=True)
FONT = os.path.join(HERE, "..", "..", "node_modules", "next", "dist", "esm", "next-devtools", "server", "font", "geist-latin.woff2")

CERULEAN, CYAN, VANILLA, SANDY, BRICK, INK = "#2D728F", "#3B8EA5", "#F5EE9E", "#F49E4C", "#AB3428", "#12303D"
COLOR = [CYAN, VANILLA, SANDY, BRICK]
ON_DARK = ["#FFFFFF", VANILLA, SANDY, "#E2604F"]

CX, CY, R = 128.0, 128.0, 104.0


def chord(y):
    return math.sqrt(max(R * R - (y - CY) ** 2, 0.0))


def band(y1, y2):
    f = lambda v: f"{v:.2f}".rstrip("0").rstrip(".")
    a1, a2 = chord(y1), chord(y2)
    if y1 <= CY - R + 0.01:
        return f"M{f(CX - a2)} {f(y2)}A{f(R)} {f(R)} 0 0 1 {f(CX + a2)} {f(y2)}Z"
    if y2 >= CY + R - 0.01:
        return f"M{f(CX - a1)} {f(y1)}H{f(CX + a1)}A{f(R)} {f(R)} 0 0 1 {f(CX - a1)} {f(y1)}Z"
    return (f"M{f(CX - a1)} {f(y1)}H{f(CX + a1)}A{f(R)} {f(R)} 0 0 1 {f(CX + a2)} {f(y2)}"
            f"H{f(CX - a2)}A{f(R)} {f(R)} 0 0 1 {f(CX - a1)} {f(y1)}Z")


TOP, BOT = CY - R, CY + R
# Celah sedikit melebar ke bawah (10, 11, 12) supaya celah atas tidak tampak lebih tebal (koreksi optis).
FULL = [(TOP, 84), (94, 128), (139, 178), (190, BOT)]
SMALL = [(TOP, 94), (112, 158), (176, BOT)]
# Versi terbalik (di atas gelap): celah dibuka +2 karena cahaya "memakan" bentuk gelap.
REVERSED = [(TOP, 83), (95, 127), (140, 177), (191, BOT)]


def symbol_svg(bands, colors, title="AP Insight"):
    paths = "".join(f'<path fill="{c}" d="{band(a, b)}"/>' for (a, b), c in zip(bands, colors))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="{title}">'
            f"<title>{title}</title>{paths}</svg>\n")


def mono_svg(bands, color, title="AP Insight"):
    d = " ".join(band(a, b) for a, b in bands)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="{title}">'
            f'<title>{title}</title><path fill="{color}" d="{d}"/></svg>\n')


# ---------- wordmark ----------
font = TTFont(FONT)
font = instantiateVariableFont(font, {"wght": 620})
gs = font.getGlyphSet()
cmap = font.getBestCmap()
hmtx = font["hmtx"]
UPM = font["head"].unitsPerEm
KERN = {("A", "P"): -18, ("P", " "): -10, ("I", "n"): -6, ("h", "t"): -8}
TRACK = -12  # satuan font (≈ -0.012em)


def glyph_path(ch, x, scale, baseline, skip_dot=False):
    """Path SVG satu glyph; untuk "i" kontur titik (ymax tertinggi) dibuang dan bounds-nya dikembalikan."""
    rec = DecomposingRecordingPen(gs)
    gs[cmap[ord(ch)]].draw(rec)
    contours, cur = [], []
    for op, args in rec.value:
        cur.append((op, args))
        if op in ("closePath", "endPath"):
            contours.append(cur)
            cur = []
    dot_bounds = None
    if skip_dot and len(contours) > 1:
        def ymax(c):
            return max(pt[1] for _, args in c for pt in args)
        top = max(range(len(contours)), key=lambda i: ymax(contours[i]))
        c = contours.pop(top)
        xs = [pt[0] for _, a in c for pt in a]
        ys = [pt[1] for _, a in c for pt in a]
        dot_bounds = (min(xs), min(ys), max(xs), max(ys))
    pen = SVGPathPen(gs)
    tp = TransformPen(pen, (scale, 0, 0, -scale, x, baseline))
    for c in contours:
        for op, args in c:
            getattr(tp, op)(*args)
    return pen.getCommands(), dot_bounds


def wordmark(text="AP Insight", cap=100.0, color=INK, dot=SANDY):
    """Kembalikan (svg_inner, width, height) dengan baseline di y=cap (tinggi huruf kapital = cap)."""
    cap_h = font["OS/2"].sCapHeight or 700
    scale = cap / cap_h
    x = 0.0
    out, dots = [], []
    prev = None
    for i, ch in enumerate(text):
        if prev:
            x += KERN.get((prev, ch), 0) * scale
        name = cmap[ord(ch)]
        if ch != " ":
            d, db = glyph_path(ch, x, scale, cap, skip_dot=(ch == "i"))
            out.append(d)
            if db:
                # titik i → persegi membulat Sandy, sedikit lebih besar dari titik asli, pusat sama
                xmin, ymin, xmax, ymax = db
                size = (xmax - xmin) * scale * 1.08
                cx = x + (xmin + xmax) / 2 * scale
                cy = cap - (ymin + ymax) / 2 * scale
                dots.append((cx - size / 2, cy - size / 2, size))
        x += (hmtx[name][0] + TRACK) * scale
        prev = ch
    width = x - TRACK * scale
    paths = f'<path fill="{color}" d="{"".join(out)}"/>'
    for (dx, dy, s) in dots:
        paths += f'<rect x="{dx:.2f}" y="{dy:.2f}" width="{s:.2f}" height="{s:.2f}" rx="{s * 0.22:.2f}" fill="{dot}"/>'
    descent = cap * 0.3
    return paths, width, cap + descent


def write(name, svg):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write(svg)


# ---------- simbol ----------
write("symbol-color.svg", symbol_svg(FULL, COLOR))
write("symbol-ondark.svg", symbol_svg(REVERSED, ON_DARK))
write("symbol-cerulean.svg", mono_svg(FULL, CERULEAN))
write("symbol-black.svg", mono_svg(FULL, "#000000"))
write("symbol-white.svg", mono_svg(REVERSED, "#FFFFFF"))
write("symbol-small.svg", symbol_svg(SMALL, [CYAN, SANDY, BRICK]))
write("symbol-small-mono.svg", mono_svg(SMALL, "#000000"))

# ---------- wordmark & lockup ----------
def lockup(kind, word_color, dot, sym_bands, sym_colors, name, descriptor=None, desc_color=None):
    wm, ww, wh = wordmark(color=word_color, dot=dot)
    cap = 100.0
    if kind == "wordmark":
        pad = 8
        W, H = ww + pad * 2, wh + pad
        body = f'<g transform="translate({pad},{pad / 2})">{wm}</g>'
    elif kind == "horizontal":
        sym = 168.0  # tinggi simbol ≈ 1,68 × tinggi kapital
        gap = sym * 0.28
        sy = 0.0
        ty = (sym - cap) / 2  # kapital tepat di tengah simbol (optis)
        W, H = sym + gap + ww, sym
        syms = "".join(f'<path fill="{c}" d="{band(a, b)}"/>' for (a, b), c in zip(sym_bands, sym_colors))
        body = (f'<g transform="translate(0,{sy}) scale({sym / 208:.5f}) translate(-24,-24)">{syms}</g>'
                f'<g transform="translate({sym + gap:.2f},{ty:.2f})">{wm}</g>')
        if descriptor:
            pass
    else:  # stacked
        sym = 220.0
        gap = 44.0
        W = max(ww, sym)
        H = sym + gap + wh
        syms = "".join(f'<path fill="{c}" d="{band(a, b)}"/>' for (a, b), c in zip(sym_bands, sym_colors))
        body = (f'<g transform="translate({(W - sym) / 2:.2f},0) scale({sym / 208:.5f}) translate(-24,-24)">{syms}</g>'
                f'<g transform="translate({(W - ww) / 2:.2f},{sym + gap:.2f})">{wm}</g>')
    m = 3  # margin anti-aliasing
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-m} {-m} {W + 2 * m:.2f} {H + 2 * m:.2f}" role="img" aria-label="AP Insight">'
           f"<title>AP Insight</title>{body}</svg>\n")
    write(name, svg)


lockup("wordmark", INK, SANDY, FULL, COLOR, "wordmark-color.svg")
lockup("wordmark", "#000000", "#000000", FULL, COLOR, "wordmark-black.svg")
lockup("horizontal", INK, SANDY, FULL, COLOR, "lockup-horizontal-color.svg")
lockup("horizontal", "#FFFFFF", SANDY, REVERSED, ON_DARK, "lockup-horizontal-ondark.svg")
lockup("horizontal", "#000000", "#000000", FULL, ["#000000"] * 4, "lockup-horizontal-black.svg")
lockup("horizontal", "#FFFFFF", "#FFFFFF", REVERSED, ["#FFFFFF"] * 4, "lockup-horizontal-white.svg")
lockup("stacked", INK, SANDY, FULL, COLOR, "lockup-stacked-color.svg")
lockup("stacked", "#FFFFFF", SANDY, REVERSED, ON_DARK, "lockup-stacked-ondark.svg")
print("ok", sorted(os.listdir(OUT)))
