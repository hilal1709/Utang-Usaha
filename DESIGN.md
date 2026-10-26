# Design — AP Insight

Mode: **Operate** (dashboard & CMS). Arah: **liquid glass** — seluruh layar berdiri di atas gradien warna penuh dari palet, semua permukaan adalah kaca tembus pandang (blur + saturasi, kilau specular, tepi terang yang memudar). Elemen khas: **"core sample" umur utang** — saldo digambar sebagai lapisan dari segar (Vanilla) ke paling tua (Brick).

## Tema
Dipilih lewat `data-theme` pada shell (`app/globals.css`). Teks utama putih di atas kaca.

| Token | Dashboard (`dash`) | CMS (`cms`) |
|---|---|---|
| `--scene` (latar) | gradien Cerulean→Pacific Cyan dengan cahaya Brick, Sandy, Vanilla | gradien Ebony→Cool Steel dengan cahaya Celadon, Light Blue, Golden Pollen |
| `--rail` (sidebar kaca melayang) | Cerulean 58% + blur, teks putih | Celadon 86% + blur, teks Ebony |
| menu aktif | pil putih, teks Cerulean | pil Ebony, teks terang |
| `--primary` / `--action` | Vanilla `#f5ee9e` (teks `#12303d`) | Golden Pollen `#ffcb47` (teks `#23271f`) |
| Tile KPI (`KpiTile tone`) | `cyan` · `vanilla` · `sandy` · `brick` | `lightblue` · `steel` · `ebony` · `pollen` |

Distribusi mengikuti referensi user: dashboard = sidebar Cerulean + tile Cyan/Vanilla/Sandy/Brick; CMS = sidebar Celadon + tile Light Blue/Cool Steel/Ebony/Golden Pollen.

## Material (`app/globals.css`)
- `.ground-fields` — latar `--scene`, `background-attachment: fixed`.
- `.glass` / `.glass-solid` — `blur(22px) saturate(1.7)`, kilau diagonal putih 20→6%, inset highlight atas, tepi gradien 1px via mask (`::before`). `.glass-solid` sedikit lebih gelap (`--glass-dense`) untuk panel grafik.
- `.glass-strong` — kaca pekat untuk modal, toast, popover.
- `.glass-tile` — kaca berwarna dari `--tile` (color-mix terang→gelap), pantulan radial di sudut kiri atas dan bulatan cahaya kanan bawah.
- `.glass-pill` — kontrol pil (select periode, badge realtime, tombol sekunder). `.glass-input` — input & select.
- Radius: panel `1.6rem`, sidebar `1.75rem`, modal `rounded-3xl`, kontrol `rounded-full`.

## Grafik (`lib/charts/theme.ts`, `components/charts`)
Batang pil putih (58%) seperti referensi; bulan berjalan / peringkat 1 Vanilla, ke-2 Sandy, ke-3 Coral `#ff8f80`, sisanya putih 34%. Donat status: Clean & Clear Vanilla, Proses Verifikasi Sandy, Belum Ditagihkan putih. Label & grid putih transparan. (Ekspor PPT tetap memakai aturan abu tua/abu muda/merah.)

## Skala umur (signature)
`Belum Jatuh Tempo #e9e08a → 1–45 #f4c06a → 46–135 #f49e4c → 136–365 #d0663a → >365 #ab3428`, di atas track `--track` putih 14%.

## Tipografi
Geist satu keluarga; angka `.num` tabular. Judul halaman 1.6–1.85rem, tracking -0.025em.

## Komponen
- Navigasi: sidebar kaca melayang (inset 12px) di desktop, Sheet di mobile; ikon Lordicon *wired outline* mengikuti `currentColor`.
- Feedback: toast `glass-strong` dengan garis status atas; banner kaca bernada (info/warning/danger/locked); modal `glass-strong`.
- Ilustrasi Lottie buatan sendiri; Aceternity `CardSpotlight` & `BackgroundGradientAnimation` di login.

## Gerak
Count-up KPI (GSAP), lapisan login (GSAP), checklist validasi (anime.js), reveal panel bawah (AOS, sekali; `suppressHydrationWarning` di panel karena AOS menambah class sebelum hidrasi). Mati pada `prefers-reduced-motion`.
