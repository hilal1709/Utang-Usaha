@AGENTS.md

# AP Insight — catatan untuk agen

Dashboard + CMS (wajib login) laporan aging utang usaha Group SIG. Next.js 16 (App Router, tanpa cacheComponents), Neon Postgres + Drizzle, Auth.js v5 (Credentials, JWT).

## Alur data
- OpCo unggah Template Utang Usaha (sheet `Detail`, header baris 10, data baris 13) di `/cms/upload`.
- Browser membaca & memvalidasi di Web Worker (`workers/parse-excel.worker.ts`) memakai `lib/validation` yang sama dengan server.
- Baris lolos dikirim per 3.000 ke `/api/upload/[id]/rows` (server memvalidasi ulang), lalu `/finalize` → versi aktif, ringkasan `ap_summary`/`ap_vendor_summary` dibangun ulang, event `data_updated` ditulis ke `data_events`.
- `/api/stream` (SSE) memantau `data_events`; `LiveProvider` me-refresh halaman.
- Laporan dihitung oleh `lib/data/report.ts` → dipakai dashboard dan ekspor (`lib/export/ppt.ts`, `lib/export/xlsx.ts`).

## Hak akses
- Peran `SUPERADMIN | ADMIN | VIEWER | OPCO` (`lib/access.ts`). SUPERADMIN lolos semua cek `ADMIN`; hanya SUPERADMIN yang mengelola akun (`/cms/users`).
- Akun OPCO hanya melihat OpCo-nya: setiap query laporan/ekspor wajib melewati `opcoScope(user)` → `buildReport(period, { opco })`. Jangan menambah query data OpCo tanpa filter ini.
- `requireUser`/`apiUser` membaca ulang baris `users` (peran, OpCo, `active`) tiap request.

## Aturan bisnis (jangan diubah tanpa Treasury)
- `lib/rules/derive.ts`: umur = akhir bulan periode − due date; bucket umur berlaku untuk semua baris (termasuk Belum Ditagihkan) — sama dengan file Gabungan.
- `lib/rules/normalize.ts`: mapping posisi/status dokumen → Masalah Dashboard, standarisasi vendor tanpa PT.
- Konsolidasi = di luar Interco. Angka Agustus 2026 harus tetap cocok dengan PPT acuan (Pihak Ketiga 6.230, Afiliasi 557, BUMN 492, Interco 9.630, C&C 4.950 M).

## Perintah
- `npm run dev` · `npm test` · `npm run typecheck` · `npm run build`
- `npm run db:generate` / `npm run db:migrate` (Drizzle)
- Impor awal: `npx tsx --env-file=.env.local scripts/import-gabungan.ts <Gabungan.xlsx> <Template.xlsx>`
- Ekspor PPT dari CLI: `npx tsx --env-file=.env.local scripts/export-ppt.ts 2026-08-31 out.pptx`
- Lottie bermerek: `python scripts/gen-lottie.py`

## graphify
Graf pengetahuan kode ada di `graphify-out/` (`GRAPH_REPORT.md`, `graph.html`, `graph.json`).
- Untuk pertanyaan arsitektur, jalankan `/graphify query "<pertanyaan>"` lebih dulu sebelum membaca banyak file.
- Setelah perubahan kode yang berarti: `/graphify . --update`.

## impeccable
Konteks desain: `PRODUCT.md`, `DESIGN.md`, `.impeccable/surfaces/`.
- Sebelum mengubah UI, muat skill impeccable; setelah selesai jalankan
  `~/.claude/skills/impeccable/scripts/impeccable detect --json app components` dan perbaiki temuannya.
- Audit berkala: `/impeccable audit`, `/impeccable critique`, `/impeccable polish`.
