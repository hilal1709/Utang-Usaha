# AP Insight — Pedoman Logo (ringkas)

## 1. Logo
- **Ide:** *Core Lens* — lensa wawasan yang dipotong lapisan. Lapisan makin ke bawah makin tebal dan makin "tua" warnanya, sama dengan skala umur utang di dashboard (Vanilla → Sandy → Brick).
- **Versi:** horizontal (utama) · bertumpuk · simbol saja · wordmark saja.
- **Konstruksi:** lingkaran r = 104 di kanvas 256; tiga celah horizontal (10–12 unit, sedikit melebar ke bawah sebagai koreksi optis); lapisan bawah 34 → 40 → 44. Titik huruf *i* diganti persegi membulat Sandy.
- **Berkas** (`design/logo/final/`):

| Kebutuhan | Berkas |
|---|---|
| Layar, latar terang | `lockup-horizontal-color.svg`, `lockup-stacked-color.svg`, `symbol-color.svg` |
| Latar gelap / sidebar Cerulean | `lockup-horizontal-ondark.svg`, `lockup-stacked-ondark.svg`, `symbol-ondark.svg` |
| Satu warna | `symbol-cerulean.svg`, `symbol-black.svg`, `symbol-white.svg`, `lockup-horizontal-black.svg`, `lockup-horizontal-white.svg`, `wordmark-black.svg` |
| ≤ 32 px | `symbol-small.svg` / `symbol-small-mono.svg` (3 lapisan) |
| Web | `favicon.ico`, `favicon.svg`, `favicon-16/32/48.png`, `apple-touch-icon.png`, `icon-192/512.png`, `maskable-512.png`, `site.webmanifest`, `head-snippet.html` |

Semua SVG berupa path murni (tanpa teks hidup, gambar, atau filter). Ekspor ulang: `python -I design/logo/build_kit.py`.

## 2. Ruang kosong
Sisakan ruang minimal **1 × tinggi huruf kapital wordmark** (= ½ diameter simbol pada lockup horizontal) di semua sisi.

## 3. Ukuran minimum
| Versi | Layar | Cetak |
|---|---|---|
| Horizontal | 120 px lebar | 30 mm |
| Bertumpuk | 72 px lebar | 18 mm |
| Simbol | 24 px (di bawah itu pakai `symbol-small`, hingga 16 px) | 6 mm |

## 4. Warna
| Nama | HEX | RGB | CMYK | Peran |
|---|---|---|---|---|
| Pacific Cyan | #3B8EA5 | 59 142 165 | 64 14 0 35 | lapisan lensa |
| Vanilla Custard | #F5EE9E | 245 238 158 | 0 3 36 4 | lapisan 1 (segar) |
| Sandy Brown | #F49E4C | 244 158 76 | 0 35 69 4 | lapisan 2, titik *i* |
| Brick Red | #AB3428 | 171 52 40 | 0 70 77 33 | lapisan 3 (tertua) |
| Cerulean | #2D728F | 45 114 143 | 69 20 0 44 | versi satu warna, latar sidebar |
| Ink | #12303D | 18 48 61 | 71 22 0 76 | wordmark |

Kode Pantone belum ditetapkan — cocokkan dengan buku warna percetakan sebelum cetak.

**Pasangan yang disetujui:** warna penuh di atas putih/latar terang · versi *ondark* di atas Cerulean atau Ink · hitam di atas putih · putih di atas Cerulean/Ink.
Lapisan Vanilla lemah di atas putih bersih; di atas putih, jaga lockup tetap di ukuran ≥ minimum dan jangan memakai simbol warna penuh di bawah 24 px (pakai `symbol-small`).

## 5. Tipografi
- Wordmark: **Geist SemiBold** (wght 620), dikonversi ke kurva — jangan diketik ulang.
- UI & dokumen: Geist (Regular/Medium/SemiBold), cadangan `system-ui`.
- Lisensi: SIL Open Font License 1.1 (boleh untuk logo).

## 6. Jangan
Jangan meregangkan atau memiringkan · jangan mengganti urutan warna lapisan (urutan = umur) · jangan memutar · jangan menambah bayangan, outline, gradien, atau efek kaca pada logo · jangan mengubah jarak/ukuran bagian lockup · jangan menaruh di latar ramai tanpa wadah · jangan memakai logo resmi SIG/Danantara bersama logo ini dalam satu lockup.

## 7. Catatan
- Mockup di `board/` (nama "Alex Morgan", domain contoh) hanya ilustrasi.
- Pemeriksaan merek dagang belum dilakukan; lakukan penelusuran merek bila logo dipakai di luar internal.
