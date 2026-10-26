# AP Insight — Utang Usaha Group

Dashboard publik dan CMS untuk laporan aging utang usaha OpCo Group SIG.

- **Dashboard (publik, tanpa login)** — `/dashboard`: Konsolidasi, Pihak Ketiga, Afiliasi, BUMN, Per OpCo, Interco (+ analisa > 365 hari). Realtime lewat SSE.
- **CMS (login)** — `/login` → unggah template, monitoring kelengkapan OpCo, kunci periode, master data, pengguna, ekspor PPT & Excel Gabungan.

## Menjalankan

```bash
npm install
cp .env.example .env.local   # isi DATABASE_URL (Neon) dan AUTH_SECRET
npm run db:migrate
npx tsx --env-file=.env.local scripts/import-gabungan.ts "<Gabungan.xlsx>" "<Template.xlsx>"
npm run dev
```

Skrip impor membuat akun superadmin, admin, pimpinan, dan satu akun per OpCo; kata sandi awal ditulis ke `seed-credentials.txt` (di-gitignore) — bagikan lewat kanal aman, lalu hapus file itu.

Membuat/memulihkan akun superadmin: `npx tsx --env-file=.env.local scripts/create-superadmin.ts [email] ["Nama"]` → kata sandi sementara di `superadmin-credentials.txt` (di-gitignore).

### Peran & hak akses
| Peran | Data | Hak tambahan |
|---|---|---|
| SUPERADMIN | Semua OpCo | Semua hak ADMIN + kelola akun di `/cms/users` |
| ADMIN (Treasury) | Semua OpCo | Monitoring, kunci periode, master data |
| VIEWER (Pimpinan) | Semua OpCo | Lihat & ekspor |
| OPCO | Hanya OpCo sendiri | Unggah, lihat, ekspor OpCo sendiri |

Seluruh aplikasi wajib login. Lingkup OpCo ditegakkan di server lewat `lib/access.ts` (`opcoScope`) dan `buildReport(period, { opco })`; `lib/session.ts` mencocokkan sesi dengan tabel `users` setiap request sehingga akun nonaktif langsung keluar.

## Validasi unggahan
Kesalahan nyata **menolak** file (kolom wajib hilang, CoCd bukan milik OpCo, tanggal/angka tidak terbaca, kategori tidak dikenal, total kolom umur ≠ Amount, baris duplikat, periode terkunci/berbeda). Penulisan sepele **dirapikan otomatis** dan dilaporkan (huruf besar/kecil, spasi, "PT", tanda Amount SAP, TOP teks). OpCo dapat mengunduh *file perbaikan*: file aslinya dengan sel bermasalah ditandai + sheet daftar perbaikan.

## Deploy (Vercel)
Set `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`. Ekspor Excel memakai `maxDuration = 300` (butuh paket Vercel yang mengizinkan). Paket Neon gratis (0,5 GB) cukup untuk ±3–4 bulan detail; arsipkan atau naikkan paket setelahnya.

## Tahap 2
Slide Tagihan PaDi Overdue, Outstanding SCF Pihak Ketiga, dan SCF RO.
