import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readDetailGrid } from "@/lib/excel/read";
import { validateGrid } from "@/lib/validation";

const TEMPLATE = "C:/Users/Lenovo/Downloads/Template Utang Usaha 30 September 2026.xlsx";
const base = { period: "2026-09-30", allowedCocds: [] as string[] };

/** Grid mini sesuai template: header di baris 10, data mulai baris 13. */
function makeGrid(rows: unknown[][]) {
  const grid: unknown[][] = Array.from({ length: 12 }, () => []);
  grid[2] = ["Per 30 September 2026"];
  grid[9] = ["CoCd", "TOP", "Umur/Aging Hutang", "Nama Vendor", "Doc. Number ", "Nomor Invoice", "Description Text", "Document Date", "Posting Date",
    "Due Date", "Amount", "Kategori Vendor", "Kategori Transaksi", "Jenis Transaksi", "Jenis Pembayaran", "Posisi Dokumen", "Status Dokumen",
    "Umur Hutang", null, null, null, null, null, "TOTAL", "Keterangan Masalah", "Keterangan atas Lain - Lain"];
  return grid.concat(rows);
}
const good = () => [3000, "90", 20, "REKAYASA ENGINEERING.PT", 5100014442, "498/RE/X/2025", "Termin 1", new Date("2025-10-06"), new Date("2025-11-11"),
  new Date("2026-02-08"), -501152400, "Third Parties", "Third Parties", "Non Semen", "SCF", "Dokumen di Bendahara", "Siap Bayar"];

describe("validateGrid", () => {
  it("baris valid distandarkan", () => {
    const res = validateGrid(makeGrid([good()]), base);
    expect(res.errorCount).toBe(0);
    expect(res.rows[0]).toMatchObject({ vendorName: "Rekayasa Engineering", amount: 501152400, top: 90, bucket: "136-365 hari", masalahDashboard: "Clean & Clear" });
    expect(res.issues.map((i) => i.code)).toEqual(expect.arrayContaining(["VENDOR_STD", "TOP_TEXT", "AMOUNT_SIGN"]));
  });

  it("menolak kategori salah, tanggal teks, dan amount bukan angka", () => {
    const bad1 = good(); bad1[11] = "Swasta Lokal";
    const bad2 = good(); bad2[8] = "kemarin";
    const bad3 = good(); bad3[10] = "lima juta";
    const res = validateGrid(makeGrid([bad1, bad2, bad3]), base);
    const codes = res.issues.filter((i) => i.severity === "error").map((i) => i.code);
    expect(codes).toEqual(expect.arrayContaining(["KV_INVALID", "POSTING_INVALID", "AMOUNT_INVALID"]));
    expect(res.rows).toHaveLength(0);
    expect(res.issues.find((i) => i.code === "KV_INVALID")!.samples[0]).toMatchObject({ row: 13, column: "L" });
  });

  it("kolom wajib hilang memblokir file", () => {
    const grid = makeGrid([good()]);
    grid[9] = grid[9].map((h) => (h === "Kategori Vendor" ? "Kategori" : h));
    const res = validateGrid(grid, base);
    expect(res.issues[0]).toMatchObject({ code: "MISSING_COLUMN", severity: "error" });
  });

  it("kolom bergeser tetap terbaca", () => {
    const grid = makeGrid([[null, ...good()]]);
    grid[9] = [null, ...grid[9]];
    const res = validateGrid(grid, base);
    expect(res.errorCount).toBe(0);
    expect(res.issues.some((i) => i.code === "HEADER_SHIFTED")).toBe(true);
  });

  it("CoCd di luar daftar OpCo & duplikat", () => {
    const res = validateGrid(makeGrid([good(), good()]), { ...base, allowedCocds: ["2000"] });
    expect(res.issues.some((i) => i.code === "COCD_NOT_ALLOWED")).toBe(true);
    const dup = validateGrid(makeGrid([good(), good()]), base);
    expect(dup.issues.some((i) => i.code === "DUPLICATE")).toBe(true);
  });

  it("periode file berbeda", () => {
    const grid = makeGrid([good()]);
    grid[2] = ["Per 31 Agustus 2026"];
    expect(validateGrid(grid, base).issues.some((i) => i.code === "PERIOD_MISMATCH")).toBe(true);
  });

  it.runIf(existsSync(TEMPLATE))("membaca template resmi", async () => {
    const { grid, detailFound } = await readDetailGrid(readFileSync(TEMPLATE));
    expect(detailFound).toBe(true);
    const res = validateGrid(grid, base);
    expect(res.issues.filter((i) => i.severity === "error")).toEqual([]);
    expect(res.rows.length).toBeGreaterThan(0);
  });
});
