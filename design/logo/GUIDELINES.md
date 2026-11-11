# AP Insight — Pedoman Logo (ringkas)

## 1. Logo
- **Logo:** SIG — chevron merah di atas huruf "SIG" hitam. Hanya simbol; **tanpa** tulisan "PT Semen Indonesia (Persero) Tbk".
- **Sumber:** gambar logo SIG → `design/logo/sig/trace.py` (vektorisasi) → `design/logo/sig/paths.json` → `components/brand/geometry.ts`.
- **Warna:** chevron `#F03340`, huruf `#0A0A0A`. Di latar gelap (sidebar/login): chevron `#FF4D5A`, huruf putih.
- **Berkas** (`design/logo/final/`):

| Kebutuhan | Berkas |
|---|---|
| Latar terang | `symbol-color.svg` |
| Latar gelap | `symbol-ondark.svg` |
| Satu warna | `symbol-black.svg`, `symbol-white.svg` |
| Web | `favicon.ico`, `favicon.svg`, `favicon-16/32/48.png`, `apple-touch-icon.png`, `icon-192/512.png`, `maskable-512.png`, `site.webmanifest`, `head-snippet.html` |

Berkas live aplikasi: `app/favicon.ico`, `app/icon.svg`, `app/apple-icon.png`, `public/brand/*`.
Ekspor ulang: `python -I design/logo/sig/trace.py <gambar>` → `python -I design/logo/sig/build_icons.py <gambar>` → `python -I design/logo/sig/build_kit.py`, lalu salin `design/logo/sig/paths.json` ke `components/brand/geometry.ts` (lihat isinya) dan jalankan `python scripts/gen-lottie.py`.

## 2. Ruang kosong & ukuran
Sisakan ruang minimal ½ tinggi huruf di semua sisi. Tinggi minimal di layar: 20 px. Ikon aplikasi memakai latar putih agar logo hitam terbaca.

## 3. Animasi loading
`public/lottie/loader.json` (dibuat `scripts/gen-lottie.py`): chevron memantul, huruf terisi menyapu kiri → kanan lalu terhapus. Warna huruf mengikuti `--ink` tema lewat class `lt-ink` (`app/globals.css`); animasi diam saat prefers-reduced-motion.

## 4. Pembuatan ulang geometry.ts
`geometry.ts` dihasilkan dari `paths.json` (konstanta `SIG_VIEWBOX`, `SIG_ASPECT`, `SIG_CHEVRON`, `SIG_LETTERS`).
