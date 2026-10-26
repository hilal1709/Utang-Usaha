import ExcelJS from "exceljs";

/** Nilai sel exceljs → nilai primitif (hasil formula, rich text, hyperlink, error). */
export function cellValue(v: ExcelJS.CellValue): unknown {
  if (v == null) return null;
  if (v instanceof Date) return v;
  if (typeof v === "object") {
    if ("result" in v) return v.result instanceof Object && "error" in (v.result as object) ? null : (v.result ?? null);
    if ("richText" in v) return v.richText.map((t) => t.text).join("");
    if ("text" in v) return (v as { text: string }).text;
    if ("error" in v) return null;
    if ("sharedFormula" in v) return (v as { result?: unknown }).result ?? null;
    return null;
  }
  return v;
}

export function sheetToGrid(ws: ExcelJS.Worksheet, maxCols = 40): unknown[][] {
  const grid: unknown[][] = [];
  ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const out: unknown[] = [];
    const n = Math.min(row.cellCount, maxCols);
    for (let c = 1; c <= n; c++) out.push(cellValue(row.getCell(c).value));
    grid[rowNumber - 1] = out;
  });
  for (let i = 0; i < grid.length; i++) if (!grid[i]) grid[i] = [];
  return grid;
}

export async function readDetailGrid(data: ArrayBuffer | Buffer): Promise<{ grid: unknown[][]; sheetNames: string[]; detailFound: boolean }> {
  const wb = new ExcelJS.Workbook();
  // exceljs menerima Buffer/ArrayBuffer; di browser ArrayBuffer.
  await wb.xlsx.load(data as ArrayBuffer);
  const sheetNames = wb.worksheets.map((w) => w.name);
  const ws = wb.worksheets.find((w) => w.name.trim().toLowerCase() === "detail");
  if (!ws) return { grid: [], sheetNames, detailFound: false };
  return { grid: sheetToGrid(ws), sheetNames, detailFound: true };
}
