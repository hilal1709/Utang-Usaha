import { PassThrough, Readable } from "node:stream";
import ExcelJS from "exceljs";
import { and, asc, eq, gt, inArray } from "drizzle-orm";
import { db } from "@/db";
import { apDetail, submissions } from "@/db/schema";
import type { Report } from "@/lib/data/report";
import { monthLabel } from "@/lib/format";

const PAGE = 20000;

const SOURCE_HEADERS = [
  "Periode", "OPCO", "Nama Vendor", "TOP", "Description Text", "Due Date", "Range TOP", "Kategori Vendor", "Kategori Transaksi",
  "Jenis Transaksi", "Jenis Pembayaran", "Posisi Dokumen", "Status Dokumen", "Masalah Dashboard", "Jatuh Tempo2",
  "Belum Jatuh Tempo", "1-45 hari", "46-135 hari", "136-365 hari", "> 365 hari", "Umur", "Nilai Tagihan",
  "CoCd", "Doc. Number", "Nomor Invoice", "Keterangan Masalah",
];
const BUCKET_COL: Record<string, number> = { "Belum Jatuh Tempo": 15, "1-45 hari": 16, "46-135 hari": 17, "136-365 hari": 18, "> 365 hari": 19 };

const ddmmyyyy = (iso: string | null) => (iso ? `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}` : null);

/**
 * Excel Gabungan (format sheet `Source` file Gabungan + sheet `Tren`) ditulis secara streaming
 * agar ±330 ribu baris tidak ditahan di memori.
 */
export function streamGabungan(report: Report): ReadableStream<Uint8Array> {
  const pass = new PassThrough();
  const wb = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: pass, useStyles: true, useSharedStrings: false });

  (async () => {
    const ws = wb.addWorksheet("Source", { views: [{ state: "frozen", ySplit: 1 }] });
    const head = ws.addRow(SOURCE_HEADERS);
    head.font = { bold: true };
    head.commit();

    const active = await db.select({ id: submissions.id }).from(submissions)
      .where(and(eq(submissions.period, report.period), eq(submissions.status, "active"), report.scope ? eq(submissions.opcoCode, report.scope) : undefined));
    const ids = active.map((a) => a.id);
    const periodDate = new Date(report.period + "T00:00:00Z");
    let cursor = 0;
    while (ids.length) {
      const rows = await db.select().from(apDetail)
        .where(and(inArray(apDetail.submissionId, ids), gt(apDetail.id, cursor)))
        .orderBy(asc(apDetail.id)).limit(PAGE);
      if (!rows.length) break;
      for (const r of rows) {
        const values: unknown[] = [
          periodDate, r.opcoCode, r.vendorName, r.top, r.description, ddmmyyyy(r.dueDate), r.rangeTop, r.kategoriVendor, r.kategoriTransaksi,
          r.jenisTransaksi, r.jenisPembayaran, r.posisiDokumen, r.statusDokumen, r.masalahDashboard, r.jatuhTempo2,
          0, 0, 0, 0, 0, r.umur, r.amount, r.cocd || null, r.docNumber || null, r.invoiceNumber, r.keteranganMasalah,
        ];
        const bc = BUCKET_COL[r.bucket];
        if (bc != null) values[bc] = r.amount;
        ws.addRow(values).commit();
      }
      cursor = rows[rows.length - 1].id;
    }
    ws.getColumn(1).numFmt = "dd/mm/yyyy";
    ws.commit();

    const tren = wb.addWorksheet("Tren");
    tren.addRow(["Tren Utang Usaha (Rupiah)", ...report.konsolidasi.trend.map((t) => monthLabel(t.period))]).commit();
    for (const [label, sec] of [
      ["Konsolidasi (di luar Interco)", report.konsolidasi], ["Third Parties", report.thirdParties], ["Afiliasi", report.afiliasi],
      ["BUMN", report.bumn], ["Interco", report.interco],
    ] as const) {
      tren.addRow([label, ...sec.trend.map((t) => t.amount)]).commit();
    }
    tren.commit();
    await wb.commit();
  })().catch((e) => pass.destroy(e));

  return Readable.toWeb(pass) as ReadableStream<Uint8Array>;
}
