/// <reference lib="webworker" />
import { readDetailGrid } from "@/lib/excel/read";
import { validateGrid } from "@/lib/validation";

export type ParseRequest = {
  buffer: ArrayBuffer;
  period: string;
  allowedCocds: string[];
  vendors: [key: string, name: string, kategori: string | null][];
};

/**
 * Membaca & memvalidasi file di browser agar file besar tidak perlu dikirim utuh
 * (batas body Vercel 4,5 MB). Hasil: daftar masalah + baris mentah yang lolos untuk dikirim per batch.
 */
self.onmessage = async (e: MessageEvent<ParseRequest>) => {
  try {
    const { buffer, period, allowedCocds, vendors } = e.data;
    self.postMessage({ type: "progress", step: "read" });
    const { grid, detailFound, sheetNames } = await readDetailGrid(buffer);
    if (!detailFound) {
      self.postMessage({ type: "fatal", message: `Sheet "Detail" tidak ditemukan. Sheet yang ada: ${sheetNames.join(", ")}. Gunakan template resmi.` });
      return;
    }
    self.postMessage({ type: "progress", step: "validate", rows: grid.length });
    const vmap = new Map(vendors.map(([k, n, c]) => [k, { standardName: n, kategoriVendor: c }]));
    const result = validateGrid(grid, { period, allowedCocds, vendorLookup: (k) => vmap.get(k) }, 20000);
    const accepted = result.rows.map((r) => ({ r: r.row, c: grid[r.row - 1] }));
    const byBucket: Record<string, number> = {};
    for (const r of result.rows) byBucket[r.bucket] = (byBucket[r.bucket] ?? 0) + r.amount;
    self.postMessage({
      type: "done",
      summary: {
        issues: result.issues, errorCount: result.errorCount, warningCount: result.warningCount, totalRows: result.totalRows,
        validRows: result.rows.length, totalAmount: result.totalAmount, map: result.map, flipSign: result.flipSign, byBucket,
      },
      accepted,
    });
  } catch (err) {
    self.postMessage({ type: "fatal", message: `File tidak dapat dibaca sebagai Excel (.xlsx): ${(err as Error).message}` });
  }
};
