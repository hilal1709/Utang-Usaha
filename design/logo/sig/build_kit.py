"""Membuat kit logo SIG di design/logo/final/.  python -I design/logo/sig/build_kit.py  (jalankan dari akar proyek; butuh paths.json & app/ + public/brand/ hasil build_icons.py)"""
import json, shutil, os
from PIL import Image
P = json.load(open("design/logo/sig/paths.json"))
F = "design/logo/final"; os.makedirs(F, exist_ok=True)
W, H = P["w"], P["h"]
def sym(name, red, ink):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><path d="{P["red"]}" fill="{red}"/><path d="{P["dark"]}" fill="{ink}"/></svg>'
    open(f"{F}/{name}.svg", "w").write(svg)
sym("symbol-color", "#F03340", "#0A0A0A")
sym("symbol-ondark", "#FF4D5A", "#FFFFFF")
sym("symbol-black", "#0A0A0A", "#0A0A0A")
sym("symbol-white", "#FFFFFF", "#FFFFFF")
shutil.copy("app/icon.svg", f"{F}/favicon.svg")
shutil.copy("app/favicon.ico", f"{F}/favicon.ico")
shutil.copy("app/apple-icon.png", f"{F}/apple-touch-icon.png")
for n in ("icon-192", "icon-512", "maskable-512"): shutil.copy(f"public/brand/{n}.png", f"{F}/{n}.png")
ico = Image.open("app/favicon.ico")
for s in (16, 32, 48):
    Image.open("public/brand/icon-512.png").resize((s, s), Image.LANCZOS).save(f"{F}/favicon-{s}.png")
open(f"{F}/site.webmanifest", "w").write(json.dumps({"name": "AP Insight — Utang Usaha Group", "short_name": "AP Insight", "start_url": "/dashboard", "display": "standalone",
    "background_color": "#FFFFFF", "theme_color": "#2D728F", "icons": [
    {"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"},
    {"src": "/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}, indent=2))
open(f"{F}/head-snippet.html", "w").write('<link rel="icon" href="/favicon.ico" sizes="48x48">\n<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n<link rel="manifest" href="/site.webmanifest">\n<meta name="theme-color" content="#2D728F">\n')
print(sorted(os.listdir(F)))
