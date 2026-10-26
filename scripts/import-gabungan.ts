/**
 * Impor awal: master OpCo & vendor (Template), detail Agustus 2026 (sheet `Source` Gabungan),
 * dan tren bulanan Des 2025–Jul 2026 (sheet `Tren`). Menyiapkan akun superadmin, admin + akun per OpCo.
 *
 *   npx tsx --env-file=.env.local scripts/import-gabungan.ts "<Gabungan.xlsx>" "<Template.xlsx>"
 */
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import ExcelJS from "exceljs";
import bcrypt from "bcryptjs";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { opcos, submissions, trendMonthly, users, vendorMaster, apDetail, apSummary, apVendorSummary, periods } from "@/db/schema";
import { cellValue } from "@/lib/excel/read";
import { normJenisPembayaran, normJenisTransaksi, normKategoriVendor, normPosisiStatus, normVendorName, parseDate, parseNumber, expectedKategoriTransaksi } from "@/lib/rules/normalize";
import { bucketFor } from "@/lib/rules/derive";
import { BUCKETS, type Bucket } from "@/lib/rules/constants";
import type { StdRow } from "@/lib/validation";
import { emitEvent, ensurePeriod, insertDetail, rebuildSummary } from "@/lib/upload/server";

const [gabunganPath, templatePath] = process.argv.slice(2);
if (!gabunganPath || !templatePath) {
  console.error("Pemakaian: tsx scripts/import-gabungan.ts <Gabungan.xlsx> <Template.xlsx>");
  process.exit(1);
}

export const OPCO_SEED: [code: string, name: string][] = [
  ["SI", "Semen Indonesia"], ["SP", "Semen Padang"], ["ST", "Semen Tonasa"], ["SG", "Semen Gresik"],
  ["SBI", "Solusi Bangun Indonesia"], ["SMBR", "Semen Baturaja"], ["SILOG", "Semen Indonesia Logistik"],
  ["SIB", "Semen Indonesia Beton"], ["UTSG", "United Tractors Semen Gresik"], ["IKSG", "Industri Kemasan Semen Gresik"],
  ["SISI", "Sinergi Informatika Semen Indonesia"], ["SMI", "Sinergi Mitra Investama"], ["KIG", "Kawasan Industri Gresik"],
  ["SKI", "Semen Kupang Indonesia"], ["SII", "Semen Indonesia International"], ["SIA", "Semen Indonesia Aceh"],
];

const log = (...a: unknown[]) => console.log(new Date().toISOString().slice(11, 19), ...a);

async function seedMaster() {
  await db.insert(opcos).values(OPCO_SEED.map(([code, name], i) => ({ code, name, sortOrder: i + 1 })))
    .onConflictDoUpdate({ target: opcos.code, set: { name: sql`excluded.name` } });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const ws = wb.getWorksheet("Lis Kategori Vendor");
  const vendors = new Map<string, { key: string; standardName: string; kategoriVendor: string | null }>();
  ws?.eachRow((row, n) => {
    if (n === 1) return;
    const kat = normKategoriVendor(cellValue(row.getCell(2).value)).value;
    const v = normVendorName(cellValue(row.getCell(3).value));
    if (v.key && kat) vendors.set(v.key, { key: v.key, standardName: v.name, kategoriVendor: kat });
  });
  const list = [...vendors.values()];
  for (let i = 0; i < list.length; i += 500) {
    await db.insert(vendorMaster).values(list.slice(i, i + 500))
      .onConflictDoUpdate({ target: vendorMaster.key, set: { standardName: sql`excluded.standard_name`, kategoriVendor: sql`excluded.kategori_vendor` } });
  }
  log(`master: ${OPCO_SEED.length} OpCo, ${list.length} vendor berelasi`);
}

async function seedUsers() {
  const existing = await db.select({ email: users.email }).from(users);
  const have = new Set(existing.map((u) => u.email));
  const lines: string[] = ["# Kredensial awal — simpan aman lalu hapus file ini. Minta pengguna mengganti password.", ""];
  const make = async (email: string, name: string, role: "SUPERADMIN" | "ADMIN" | "OPCO" | "VIEWER", opcoCode: string | null) => {
    if (have.has(email)) return;
    const pw = randomBytes(9).toString("base64url");
    await db.insert(users).values({ email, name, role, opcoCode, passwordHash: await bcrypt.hash(pw, 10) });
    lines.push(`${role.padEnd(10)} ${email.padEnd(28)} ${pw}`);
  };
  await make("superadmin@apinsight.local", "Superadmin", "SUPERADMIN", null);
  await make("admin@apinsight.local", "Admin Treasury", "ADMIN", null);
  await make("direksi@apinsight.local", "Pimpinan", "VIEWER", null);
  for (const [code, name] of OPCO_SEED) await make(`${code.toLowerCase()}@apinsight.local`, `AP ${name}`, "OPCO", code);
  if (lines.length > 2) {
    writeFileSync("seed-credentials.txt", lines.join("\n") + "\n");
    log(`akun dibuat: ${lines.length - 2} → seed-credentials.txt`);
  }
}

/** Sheet `Tren`: blok Third Parties/Afiliasi/BUMN/Interco (kolom OPCO + Des 2025..Des 2026). */
async function importTrend(wb: ExcelJS.Workbook) {
  const ws = wb.getWorksheet("Tren");
  if (!ws) return log("sheet Tren tidak ada, dilewati");
  const blocks: [number, string][] = [[45, "Third Parties"], [62, "Afiliasi"], [79, "BUMN"], [96, "Interco"]]; // kolom OPCO (1-based)
  const months = Array.from({ length: 8 }, (_, i) => new Date(Date.UTC(2025, 11 + i + 1, 0)).toISOString().slice(0, 10)); // Des25..Jul26
  const values: (typeof trendMonthly.$inferInsert)[] = [];
  for (const [col, kategori] of blocks) {
    for (let r = 8; r <= ws.rowCount; r++) {
      const code = String(cellValue(ws.getRow(r).getCell(col).value) ?? "").trim().toUpperCase();
      if (!code || code === "TOTAL") break;
      months.forEach((period, i) => {
        const n = parseNumber(cellValue(ws.getRow(r).getCell(col + 1 + i).value));
        if (n != null) values.push({ period, opcoCode: code, kategoriVendor: kategori, amount: n });
      });
    }
  }
  const known = new Set(OPCO_SEED.map(([c]) => c));
  const rows = values.filter((v) => known.has(v.opcoCode));
  for (const p of months) await ensurePeriod(p);
  await db.delete(trendMonthly);
  for (let i = 0; i < rows.length; i += 1000) await db.insert(trendMonthly).values(rows.slice(i, i + 1000));
  log(`tren: ${rows.length} titik data`);
}

const BUCKET_COLS: [number, Bucket][] = [[15, "Belum Jatuh Tempo"], [16, "1-45 hari"], [17, "46-135 hari"], [18, "136-365 hari"], [19, "> 365 hari"]];

async function importSource() {
  const period = "2026-08-31";
  await ensurePeriod(period);
  const subs = new Map<string, { id: number; buf: StdRow[]; count: number; total: number }>();
  const subFor = async (code: string) => {
    let s = subs.get(code);
    if (s) return s;
    await db.delete(submissions).where(and(eq(submissions.period, period), eq(submissions.opcoCode, code)));
    const [row] = await db.insert(submissions).values({ opcoCode: code, period, version: 1, source: "import", fileName: "Utang Usaha Gabungan 2026 per 31 Agustus 2026 Rev.01.xlsx", note: "Impor awal" }).returning();
    s = { id: row.id, buf: [], count: 0, total: 0 };
    subs.set(code, s);
    return s;
  };
  const flush = async (code: string, s: { id: number; buf: StdRow[] }) => {
    await insertDetail({ id: s.id, period, opcoCode: code }, s.buf);
    s.buf = [];
  };

  const reader = new ExcelJS.stream.xlsx.WorkbookReader(gabunganPath, { sharedStrings: "cache", worksheets: "emit", hyperlinks: "ignore", styles: "ignore", entries: "emit" });
  let n = 0, skipped = 0;
  for await (const ws of reader) {
    // @ts-expect-error nama sheet tersedia di WorksheetReader
    if (ws.name !== "Source") continue;
    for await (const row of ws) {
      if (row.number < 3) continue;
      const v = (i: number) => cellValue(row.getCell(i + 1).value);
      const code = String(v(1) ?? "").trim().toUpperCase();
      const amount = parseNumber(v(21));
      const kv = normKategoriVendor(v(7)).value;
      const jt = normJenisTransaksi(v(9)).value;
      const jp = normJenisPembayaran(v(10)).value;
      const ps = normPosisiStatus(v(11), v(12));
      if (!code || amount == null || !kv || !jt || !jp || !ps) { skipped++; continue; }
      const umur = parseNumber(v(20));
      let bucket: Bucket = bucketFor(umur);
      for (const [i, b] of BUCKET_COLS) if ((parseNumber(v(i)) ?? 0) !== 0) { bucket = b; break; }
      const s = await subFor(code);
      s.buf.push({
        row: row.number, cocd: "", vendorName: normVendorName(v(2)).name || "(tanpa nama)", top: parseNumber(v(3)),
        docNumber: "", invoiceNumber: null, description: v(4) == null ? null : String(v(4)), documentDate: null, postingDate: null as unknown as string,
        dueDate: parseDate(v(5)), amount, kategoriVendor: kv, kategoriTransaksi: expectedKategoriTransaksi(kv), jenisTransaksi: jt, jenisPembayaran: jp,
        posisiDokumen: ps.posisi, statusDokumen: ps.status, masalahDashboard: ps.masalah,
        rangeTop: String(v(6) ?? (umur != null && umur > 0 ? ">TOP" : "Range TOP")), jatuhTempo2: String(v(14) ?? ps.masalah),
        umur: umur == null ? null : Math.round(umur), bucket, keteranganMasalah: null, keteranganLain: null,
      });
      s.count++; s.total += amount;
      if (s.buf.length >= 3000) await flush(code, s);
      if (++n % 20000 === 0) log(`  ${n.toLocaleString("id-ID")} baris…`);
    }
  }
  for (const [code, s] of subs) {
    if (s.buf.length) await flush(code, s);
    await db.update(submissions).set({ status: "active", rowCount: s.count, expectedRows: s.count, totalAmount: s.total, finalizedAt: new Date() }).where(eq(submissions.id, s.id));
    await rebuildSummary(db, period, code, s.id);
  }
  await emitEvent("data_updated", "Impor data Gabungan Agustus 2026 selesai", period, null);
  log(`source: ${n.toLocaleString("id-ID")} baris diimpor, ${skipped} dilewati, ${subs.size} OpCo`);
}

async function report() {
  const res = await db.execute<{ kategori_vendor: string; total: string }>(sql`
    select kategori_vendor, sum(amount)::text total from ${apSummary} where period = '2026-08-31' group by 1 order by 1`);
  for (const r of res.rows) log(`  ${r.kategori_vendor.padEnd(14)} Rp ${(Number(r.total) / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 2 })} M`);
}

(async () => {
  void apDetail; void apVendorSummary; void periods; void BUCKETS;
  await seedMaster();
  await seedUsers();
  const wb = new ExcelJS.Workbook();
  log("membaca sheet Tren…");
  // Workbook penuh hanya untuk sheet kecil Tren; Source dibaca secara streaming.
  const trendReader = new ExcelJS.stream.xlsx.WorkbookReader(gabunganPath, { sharedStrings: "cache", worksheets: "emit", styles: "ignore", hyperlinks: "ignore" });
  for await (const ws of trendReader) {
    // @ts-expect-error nama sheet tersedia di WorksheetReader
    if (ws.name !== "Tren") continue;
    const target = wb.addWorksheet("Tren");
    for await (const row of ws) {
      const out = target.getRow(row.number);
      row.eachCell({ includeEmpty: false }, (c, col) => { out.getCell(col).value = cellValue(c.value) as ExcelJS.CellValue; });
    }
  }
  await importTrend(wb);
  log("mengimpor sheet Source (bisa beberapa menit)…");
  await importSource();
  await report();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
