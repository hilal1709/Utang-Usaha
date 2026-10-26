# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Staf AP OpCo (laptop):** setiap awal bulan mengunggah file aging utang usaha (Template Utang Usaha) untuk OpCo-nya, lalu memperbaiki baris yang ditolak menjelang tenggat.
- **Treasury holding — Unit AR/AP Management & Liquidity (desktop):** memantau kelengkapan unggahan seluruh OpCo, mengelola master data, mengunci periode, dan mengekspor PPT laporan bulanan.
- **Pimpinan (tablet/HP):** membaca dashboard ringkas dan kesimpulan.
- **Rapat:** dashboard ditayangkan di layar besar/proyektor saat laporan dipresentasikan.

## Product Purpose
AP Insight menggantikan konsolidasi manual laporan utang usaha Group SIG. OpCo mengunggah template; sistem menolak file yang tidak standar dengan alasan per baris/kolom, merapikan penyimpangan sepele, menggabungkan data seluruh OpCo, menampilkan dashboard realtime, dan menghasilkan PPT "Laporan Aging Utang Usaha Group AP Management" serta Excel Gabungan. Sukses = laporan bulanan siap tanpa perbaikan manual oleh Treasury dan angkanya sama dengan perhitungan Excel.

## Positioning
Aturan penyusunan laporan Treasury (umur dari akhir bulan, bucket 1-45/46-135/136-365/>365, mapping posisi dokumen → Clean & Clear / Proses Verifikasi / Belum Ditagihkan, standarisasi vendor tanpa PT) dijalankan otomatis di titik unggah, jadi data gabungan dan PPT selalu memakai satu definisi.

## Operating Context
- Siklus bulanan per periode akhir bulan; ±16 OpCo (SI, SP, ST, SG, SBI, SMBR, SILOG, SIB, UTSG, IKSG, SISI, SMI, KIG, SKI, SII, SIA); ±330 ribu baris per periode (SI sendiri ±176 ribu).
- Sumber: ekspor SAP OpCo ke Template Utang Usaha (sheet `Detail`, header baris 10, data baris 13).
- Keluaran: PPT bulanan untuk pimpinan; slide PaDi Overdue, SCF Pihak Ketiga, SCF RO adalah tahap 2.
- Kategori vendor: Third Parties (Pihak Ketiga), Afiliasi, BUMN, Interco. Konsolidasi = di luar Interco. Nilai disajikan dalam Milyar Rupiah.

## Capabilities and Constraints
- Next.js 16 + Neon Postgres + Auth.js; deploy Vercel (batas body 4,5 MB → parsing Excel di browser, kirim per batch).
- Peran: SUPERADMIN (kelola akun & hak akses), ADMIN (Treasury), OPCO (unggah & lihat data OpCo sendiri saja), VIEWER (pimpinan). Seluruh aplikasi wajib login.
- Realtime: pembaruan data tampil tanpa muat ulang.
- Validasi: kesalahan nyata memblokir; hal sepele dirapikan dan dilaporkan sebagai peringatan.

## Brand Commitments
- Nama: **AP Insight**. Tidak memakai logo resmi SIG.
- Bahasa antarmuka: Bahasa Indonesia; istilah AP (TOP, SCF, SKBDN, Interco, Clean & Clear) dipertahankan.
- Palet dashboard: #2d728f, #3b8ea5, #f5ee9e, #f49e4c, #ab3428 — distribusi seperti referensi user (sidebar Cerulean, kartu KPI cyan/vanilla/sandy/brick).
- Palet CMS: #b9d8c2, #9ac2c9, #8aa1b1, #4a5043, #ffcb47.
- Gaya diminta user: glassmorphism / liquid glass, premium dan profesional; shadcn/ui + Aceternity, GSAP/AOS/Swiper/anime.js, Lordicon (hemat), Lottie untuk ilustrasi, Chart.js.

## Evidence on Hand
- `C:/Users/Lenovo/Downloads/Laporan Utang Usaha Group AP Management per 31 Agustus 2026.pptx` (struktur PPT acuan).
- `Utang Usaha Gabungan 2026 per 31 Agustus 2026 Rev.01.xlsx` (data riil, diimpor), `Template Utang Usaha 30 September 2026.xlsx`.
- `Catatan Penyusunan Laporan Utang.docx` (aturan bisnis & aturan PPT).
- Tidak ada testimoni/klien/metrik pemasaran — jangan dibuat-buat.

## Product Principles
1. Angka harus sama dengan perhitungan Treasury; tampilkan sumber dan periode di setiap angka.
2. Error menjelaskan apa yang salah, di baris/kolom mana, dan cara memperbaikinya.
3. Satu definisi aturan untuk unggah, dashboard, dan PPT.
4. Ringkas untuk pimpinan, rinci untuk Treasury.

## Accessibility & Inclusion
Harus terbaca di proyektor (kontras tinggi, angka besar) dan di HP; hormati `prefers-reduced-motion`.
