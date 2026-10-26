import ExcelJS from "exceljs";
import type { IssueGroup } from "@/lib/validation";

const RED = "FFF5D3CF";
const AMBER = "FFFFE9B0";

/**
 * File perbaikan untuk OpCo: file asli dengan sel bermasalah diwarnai (merah = harus diperbaiki,
 * kuning = sudah dirapikan sistem) dan diberi catatan, plus sheet "Daftar Perbaikan".
 */
export async function buildCorrectionWorkbook(original: ArrayBuffer, groups: IssueGroup[]): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(original.slice(0));
  const ws = wb.worksheets.find((w) => w.name.trim().toLowerCase() === "detail");

  if (ws) {
    for (const g of groups) {
      for (const i of g.samples) {
        if (!i.row || !i.column || !/^[A-Z]{1,2}$/.test(i.column)) continue;
        const cell = ws.getCell(`${i.column}${i.row}`);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: i.severity === "error" ? RED : AMBER } };
        cell.note = `${g.severity === "error" ? "PERBAIKI" : "DIRAPIKAN"}: ${i.message}${i.suggestion ? `\nSaran: ${i.suggestion}` : ""}`;
      }
    }
  }

  const old = wb.getWorksheet("Daftar Perbaikan");
  if (old) wb.removeWorksheet(old.id);
  const list = wb.addWorksheet("Daftar Perbaikan", { views: [{ state: "frozen", ySplit: 1 }] });
  list.columns = [
    { header: "Status", key: "sev", width: 12 },
    { header: "Baris", key: "row", width: 8 },
    { header: "Kolom", key: "col", width: 8 },
    { header: "Jenis masalah", key: "title", width: 42 },
    { header: "Nilai di file", key: "value", width: 30 },
    { header: "Keterangan", key: "msg", width: 60 },
    { header: "Saran perbaikan", key: "sug", width: 40 },
  ];
  list.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  list.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4A5043" } };
  for (const g of groups) {
    for (const i of g.samples) {
      const r = list.addRow({
        sev: g.severity === "error" ? "Perbaiki" : "Dirapikan", row: i.row ?? "", col: i.column ?? "", title: g.title,
        value: i.value ?? "", msg: i.message, sug: i.suggestion ?? "",
      });
      r.getCell("sev").fill = { type: "pattern", pattern: "solid", fgColor: { argb: g.severity === "error" ? RED : AMBER } };
    }
    if (g.count > g.samples.length) list.addRow({ sev: "", title: `… dan ${g.count - g.samples.length} lainnya untuk "${g.title}"` });
  }
  list.autoFilter = { from: "A1", to: "G1" };

  const out = await wb.xlsx.writeBuffer();
  return new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
