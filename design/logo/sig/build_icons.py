"""Membuat favicon & ikon PWA dari logo SIG.  python -I design/logo/sig/build_icons.py <gambar-sumber>"""
import json, sys, numpy as np
from PIL import Image
SRC = sys.argv[1]
P = json.load(open("design/logo/sig/paths.json"))
X0, Y0, X1, Y1 = 484, 212, 1068, 552
S = 4
im = Image.open(SRC).convert("RGB").crop((X0, Y0, X1, Y1))
im = im.resize((im.width * S, im.height * S), Image.LANCZOS)
a = np.array(im).astype(float)
lum = a.sum(2) / 3
redness = a[:, :, 0] - a[:, :, 1]
a_red = np.clip((redness - 40) / 100, 0, 1)
a_dark = np.clip((200 - lum) / 120, 0, 1) * (1 - a_red)
RED, DARK = np.array([240, 51, 64]), np.array([10, 10, 10])
def logo_rgba():
    out = np.zeros(a.shape[:2] + (4,))
    out[..., :3] = (RED * a_red[..., None] + DARK * a_dark[..., None]) / np.maximum(a_red + a_dark, 1e-6)[..., None]
    out[..., 3] = np.clip(a_red + a_dark, 0, 1) * 255
    return Image.fromarray(out.astype("uint8"), "RGBA")
LOGO = logo_rgba()
def canvas(size, frac, bg=(255, 255, 255, 255)):
    c = Image.new("RGBA", (size, size), bg)
    w = int(size * frac); h = int(w * LOGO.height / LOGO.width)
    l = LOGO.resize((w, h), Image.LANCZOS)
    c.alpha_composite(l, ((size - w) // 2, (size - h) // 2))
    return c.convert("RGBA")
def save(img, path): img.save(path); print(path)
save(canvas(512, 0.80), "public/brand/icon-512.png")
save(canvas(192, 0.80), "public/brand/icon-192.png")
save(canvas(512, 0.58), "public/brand/maskable-512.png")
save(canvas(180, 0.80), "app/apple-icon.png")
big = canvas(256, 0.92)
big.save("app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)]); print("app/favicon.ico")
W, H = P["w"], P["h"]
k = 0.88 * 256 / W; ty = (256 - H * k) / 2; tx = 256 * 0.06
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" rx="48" fill="#fff"/>'
       f'<g transform="translate({tx:.2f} {ty:.2f}) scale({k:.4f})"><path d="{P["red"]}" fill="#F03340"/><path d="{P["dark"]}" fill="#0A0A0A"/></g></svg>')
open("app/icon.svg", "w").write(svg); print("app/icon.svg")
import shutil
shutil.copy("design/logo/sig/sig-mark.svg", "public/brand/mark.svg")
