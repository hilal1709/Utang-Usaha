import { FIRST_DATA_ROW, HEADER_ROW, TEMPLATE_COLUMNS, type Bucket, type KategoriVendor, type TemplateKey } from "@/lib/rules/constants";
import {
  cellText, expectedKategoriTransaksi, looseKey, normJenisPembayaran, normJenisTransaksi, normKategoriTransaksi,
  normKategoriVendor, normPosisiStatus, normVendorName, parseDate, parseNumber,
} from "@/lib/rules/normalize";
import { TEMPLATE_BUCKET_KEYS, deriveAging, resolveDueDate } from "@/lib/rules/derive";

export type Severity = "error" | "warning";
export type Issue = { row: number | null; column: string | null; code: string; message: string; severity: Severity; value?: string; suggestion?: string };
export type IssueGroup = { code: string; severity: Severity; title: string; count: number; samples: Issue[] };

export type StdRow = {
  row: number;
  cocd: string;
  vendorName: string;
  top: number | null;
  docNumber: string;
  invoiceNumber: string | null;
  description: string | null;
  documentDate: string | null;
  postingDate: string;
  dueDate: string | null;
  amount: number;
  kategoriVendor: KategoriVendor;
  kategoriTransaksi: "Third Parties" | "ICS";
  jenisTransaksi: "Semen" | "Non Semen";
  jenisPembayaran: "TT" | "SCF" | "SKBDN";
  posisiDokumen: string;
  statusDokumen: string;
  masalahDashboard: string;
  rangeTop: string;
  jatuhTempo2: string;
  umur: number | null;
  bucket: Bucket;
  keteranganMasalah: string | null;
  keteranganLain: string | null;
};

export type ColumnMap = Partial<Record<TemplateKey, number>>;
export type VendorLookup = (key: string) => { standardName: string; kategoriVendor: string | null } | undefined;

export type Ctx = {
  period: string; // yyyy-mm-dd akhir bulan
  allowedCocds: string[];
  /** true bila konvensi file memakai tanda negatif SAP untuk utang → dibalik jadi positif. */
  flipSign: boolean;
  vendorLookup?: VendorLookup;
};

export const ISSUE_TITLES: Record<string, string> = {
  NO_DETAIL_SHEET: "Sheet 'Detail' tidak ditemukan",
  HEADER_NOT_FOUND: "Baris header template tidak ditemukan",
  HEADER_SHIFTED: "Posisi header/kolom bergeser dari template",
  MISSING_COLUMN: "Kolom wajib tidak ada",
  PERIOD_MISMATCH: "Periode file berbeda dengan periode upload",
  EMPTY_FILE: "Tidak ada baris data",
  COCD_EMPTY: "CoCd kosong",
  COCD_NOT_ALLOWED: "CoCd bukan milik OpCo ini",
  TOP_INVALID: "TOP bukan angka",
  TOP_TEXT: "TOP ditulis sebagai teks (dirapikan)",
  VENDOR_EMPTY: "Nama vendor kosong",
  VENDOR_STD: "Nama vendor distandarkan (tanpa PT/Tbk)",
  VENDOR_MASTER_KATEGORI: "Kategori vendor berbeda dengan master",
  DOC_EMPTY: "Doc. Number kosong",
  POSTING_INVALID: "Posting Date kosong/tidak valid",
  DOCDATE_INVALID: "Document Date tidak valid (diabaikan)",
  DUE_INVALID: "Due Date tidak valid",
  DUE_FILLED: "Due Date kosong diisi otomatis",
  AMOUNT_INVALID: "Amount kosong/bukan angka",
  AMOUNT_ZERO: "Amount bernilai 0 (baris diabaikan)",
  AMOUNT_SIGN: "Tanda Amount dinormalkan (SAP negatif → positif)",
  KV_INVALID: "Kategori Vendor tidak dikenal",
  KT_INVALID: "Kategori Transaksi tidak dikenal",
  KT_FIXED: "Kategori Transaksi disesuaikan dengan Kategori Vendor",
  JT_INVALID: "Jenis Transaksi tidak dikenal",
  JP_INVALID: "Jenis Pembayaran tidak dikenal",
  POSISI_INVALID: "Posisi/Status Dokumen tidak dikenal",
  VALUE_STD: "Penulisan nilai dirapikan (huruf besar/kecil, spasi)",
  BUCKET_SUM: "Total kolom umur (R–W) tidak sama dengan Amount",
  BUCKET_DIFF: "Penempatan kolom umur berbeda dari hitungan sistem",
  DUPLICATE: "Baris duplikat (CoCd + Doc. Number + tahun posting + nilai sama)",
};

const SAMPLE_LIMIT = 300;

export class IssueCollector {
  private groups = new Map<string, IssueGroup>();
  constructor(private limit = SAMPLE_LIMIT) {}
  add(i: Issue) {
    let g = this.groups.get(i.code);
    if (!g) {
      g = { code: i.code, severity: i.severity, title: ISSUE_TITLES[i.code] ?? i.code, count: 0, samples: [] };
      this.groups.set(i.code, g);
    }
    g.count++;
    if (g.samples.length < this.limit) g.samples.push(i);
  }
  merge(groups: IssueGroup[]) {
    for (const src of groups) {
      const g = this.groups.get(src.code);
      if (!g) { this.groups.set(src.code, { ...src, samples: src.samples.slice(0, SAMPLE_LIMIT) }); continue; }
      g.count += src.count;
      g.samples.push(...src.samples.slice(0, Math.max(0, SAMPLE_LIMIT - g.samples.length)));
    }
  }
  list(): IssueGroup[] {
    return [...this.groups.values()].sort((a, b) => (a.severity === b.severity ? b.count - a.count : a.severity === "error" ? -1 : 1));
  }
  get errorCount() { let n = 0; for (const g of this.groups.values()) if (g.severity === "error") n += g.count; return n; }
  get warningCount() { let n = 0; for (const g of this.groups.values()) if (g.severity === "warning") n += g.count; return n; }
}

const colLetter = (idx: number) => {
  let n = idx + 1, s = "";
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
};

/**
 * Cari baris header (biasanya baris 10) dan petakan kolom berdasarkan nama, sehingga kolom yang
 * bergeser/tertukar tetap terbaca. `grid[0]` = baris Excel 1.
 */
export function detectColumns(grid: unknown[][], issues: IssueCollector): { map: ColumnMap; headerRow: number; firstDataRow: number } | null {
  let headerIdx = -1;
  for (let r = 0; r < Math.min(grid.length, 30); r++) {
    const keys = (grid[r] ?? []).map((c) => looseKey(cellText(c)));
    if (keys.includes("cocd") && keys.some((k) => k === "namavendor" || k === "vendor")) { headerIdx = r; break; }
  }
  if (headerIdx < 0) {
    issues.add({ row: HEADER_ROW, column: null, code: "HEADER_NOT_FOUND", severity: "error",
      message: "Tidak menemukan baris header berisi 'CoCd' dan 'Nama Vendor'. Gunakan template resmi tanpa mengubah baris 8–12." });
    return null;
  }
  const header = (grid[headerIdx] ?? []).map((c) => looseKey(cellText(c)));
  const map: ColumnMap = {};
  for (const col of TEMPLATE_COLUMNS) {
    const idx = header.findIndex((h) => h && col.aliases.includes(h));
    if (idx >= 0) map[col.key] = idx;
  }
  // Kolom umur R–W berada tepat setelah kolom "Umur Hutang"/"Belum ditagih" (header bertingkat).
  if (map.bBelumTagih != null) {
    const base = map.bBelumTagih;
    (["bBelumJt", "b1_45", "b46_135", "b136_365", "b365"] as const).forEach((k, i) => { map[k] = base + 1 + i; });
  }
  for (const col of TEMPLATE_COLUMNS) {
    if (col.required && map[col.key] == null) {
      issues.add({ row: headerIdx + 1, column: col.col, code: "MISSING_COLUMN", severity: "error",
        message: `Kolom "${col.label}" tidak ditemukan di header baris ${headerIdx + 1}.`, suggestion: `Kembalikan kolom ${col.col} = "${col.label}" sesuai template.` });
    }
  }
  const shifted = headerIdx + 1 !== HEADER_ROW ||
    TEMPLATE_COLUMNS.some((c) => c.aliases.length && map[c.key] != null && map[c.key] !== c.col.charCodeAt(0) - 65);
  if (shifted) {
    issues.add({ row: headerIdx + 1, column: null, code: "HEADER_SHIFTED", severity: "warning",
      message: "Header/kolom tidak berada di posisi template; sistem membaca berdasarkan nama kolom." });
  }
  return { map, headerRow: headerIdx + 1, firstDataRow: headerIdx + 1 + (FIRST_DATA_ROW - HEADER_ROW) };
}

/** Cek periode pada sel A3 ("Per 30 September 2026") bila diisi. */
export function checkPeriodCell(grid: unknown[][], period: string, issues: IssueCollector) {
  const raw = grid[2]?.[0];
  const d = raw instanceof Date ? parseDate(raw) : parseIndoDate(cellText(raw).replace(/^per\s*/i, ""));
  if (d && d !== period) {
    issues.add({ row: 3, column: "A", code: "PERIOD_MISMATCH", severity: "error", value: cellText(raw),
      message: `Periode di file (${d}) tidak sama dengan periode upload (${period}).`, suggestion: "Pilih periode yang benar atau perbaiki sel A3." });
  }
}

const BULAN: Record<string, number> = { januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6, juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12 };
function parseIndoDate(s: string) {
  const m = s.trim().toLowerCase().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
  if (m && BULAN[m[2]]) return parseDate(`${m[3]}-${BULAN[m[2]]}-${m[1]}`);
  return parseDate(s);
}

const isBlankRow = (r: unknown[] | undefined) => !r || r.every((c) => c == null || cellText(c) === "");

/** Tentukan konvensi tanda: jika mayoritas Amount negatif (ekspor SAP), balik semua tanda. */
export function decideFlipSign(grid: unknown[][], map: ColumnMap, firstDataRow: number) {
  let neg = 0, pos = 0;
  const ai = map.amount;
  if (ai == null) return false;
  for (let r = firstDataRow - 1; r < grid.length; r++) {
    const n = parseNumber(grid[r]?.[ai]);
    if (n == null || n === 0) continue;
    if (n < 0) neg++; else pos++;
  }
  return neg > pos;
}

function addFix(issues: IssueCollector, row: number, col: string, from: string, to: string, code = "VALUE_STD") {
  issues.add({ row, column: col, code, severity: "warning", value: from, suggestion: to, message: `"${from}" → "${to}"` });
}

/** Validasi & standarisasi satu baris. Mengembalikan null bila baris memiliki error (atau dilewati). */
export function validateRow(cells: unknown[], excelRow: number, map: ColumnMap, ctx: Ctx, issues: IssueCollector): StdRow | null {
  const get = (k: TemplateKey) => (map[k] == null ? undefined : cells[map[k]!]);
  const L = (k: TemplateKey) => (map[k] == null ? TEMPLATE_COLUMNS.find((c) => c.key === k)!.col : colLetter(map[k]!));
  let ok = true;
  const err = (k: TemplateKey, code: string, message: string, value?: unknown, suggestion?: string) => {
    ok = false;
    issues.add({ row: excelRow, column: L(k), code, severity: "error", message, value: value == null ? undefined : cellText(value), suggestion });
  };

  const amountRaw = parseNumber(get("amount"));
  if (amountRaw == null) { err("amount", "AMOUNT_INVALID", "Amount wajib berupa angka.", get("amount"), "Isi nilai numerik tanpa teks, contoh -501152400"); }
  else if (amountRaw === 0) { issues.add({ row: excelRow, column: L("amount"), code: "AMOUNT_ZERO", severity: "warning", message: "Amount 0 tidak dihitung." }); return null; }
  const amount = amountRaw == null ? 0 : ctx.flipSign ? -amountRaw : amountRaw;

  const cocd = cellText(get("cocd"));
  if (!cocd) err("cocd", "COCD_EMPTY", "CoCd wajib diisi.");
  else if (ctx.allowedCocds.length && !ctx.allowedCocds.includes(cocd)) {
    err("cocd", "COCD_NOT_ALLOWED", `CoCd ${cocd} tidak terdaftar untuk OpCo ini.`, cocd, `CoCd terdaftar: ${ctx.allowedCocds.join(", ")}`);
  }

  let top: number | null = null;
  const topRaw = get("top");
  if (topRaw != null && cellText(topRaw) !== "") {
    top = parseNumber(topRaw);
    if (top == null || top < 0) err("top", "TOP_INVALID", "TOP harus angka hari (mis. 30).", topRaw);
    else if (typeof topRaw === "string") addFix(issues, excelRow, L("top"), topRaw, String(top), "TOP_TEXT");
  }

  const vendorRaw = cellText(get("vendor"));
  let vendorName = "";
  let masterKategori: string | null = null;
  if (!vendorRaw) err("vendor", "VENDOR_EMPTY", "Nama vendor wajib diisi.");
  else {
    const v = normVendorName(vendorRaw);
    const master = ctx.vendorLookup?.(v.key);
    vendorName = master?.standardName ?? v.name;
    masterKategori = master?.kategoriVendor ?? null;
    if (vendorName !== vendorRaw) addFix(issues, excelRow, L("vendor"), vendorRaw, vendorName, "VENDOR_STD");
  }

  const docNumber = cellText(get("docNumber"));
  if (!docNumber) err("docNumber", "DOC_EMPTY", "Doc. Number wajib diisi.");

  const postingDate = parseDate(get("postingDate"));
  if (!postingDate) err("postingDate", "POSTING_INVALID", "Posting Date wajib berupa tanggal (format tanggal Excel atau dd-mm-yyyy).", get("postingDate"));

  let documentDate = null as string | null;
  const docDateRaw = get("documentDate");
  if (docDateRaw != null && cellText(docDateRaw) !== "") {
    documentDate = parseDate(docDateRaw);
    if (!documentDate) issues.add({ row: excelRow, column: L("documentDate"), code: "DOCDATE_INVALID", severity: "warning", message: "Document Date tidak terbaca.", value: cellText(docDateRaw) });
  }

  let dueDateFile: string | null = null;
  const dueRaw = get("dueDate");
  if (dueRaw != null && cellText(dueRaw) !== "") {
    dueDateFile = parseDate(dueRaw);
    if (!dueDateFile) err("dueDate", "DUE_INVALID", "Due Date tidak terbaca sebagai tanggal.", dueRaw, "Gunakan format tanggal Excel atau dd-mm-yyyy");
  }

  const kv = normKategoriVendor(get("kategoriVendor"));
  if (!kv.value) err("kategoriVendor", "KV_INVALID", "Kategori Vendor harus Third Parties / Afiliasi / BUMN / Interco.", kv.raw);
  else if (kv.fix) addFix(issues, excelRow, L("kategoriVendor"), kv.fix.from, kv.fix.to);
  if (kv.value && masterKategori && masterKategori !== kv.value) {
    issues.add({ row: excelRow, column: L("kategoriVendor"), code: "VENDOR_MASTER_KATEGORI", severity: "warning", value: kv.value, suggestion: masterKategori,
      message: `Vendor "${vendorName}" tercatat sebagai ${masterKategori} di master, file menulis ${kv.value}.` });
  }

  const kt = normKategoriTransaksi(get("kategoriTransaksi"));
  let kategoriTransaksi = kt.value;
  if (!kt.value && kt.raw) err("kategoriTransaksi", "KT_INVALID", "Kategori Transaksi harus Third Parties / ICS.", kt.raw);
  if (kv.value) {
    const expected = expectedKategoriTransaksi(kv.value);
    if (kategoriTransaksi !== expected && (kt.value || !kt.raw)) {
      issues.add({ row: excelRow, column: L("kategoriTransaksi"), code: "KT_FIXED", severity: "warning", value: kt.raw, suggestion: expected,
        message: `Kategori Vendor ${kv.value} → Kategori Transaksi ${expected}.` });
      kategoriTransaksi = expected;
    } else if (kt.fix) addFix(issues, excelRow, L("kategoriTransaksi"), kt.fix.from, kt.fix.to);
  }

  const jt = normJenisTransaksi(get("jenisTransaksi"));
  if (!jt.value) err("jenisTransaksi", "JT_INVALID", "Jenis Transaksi harus Semen / Non Semen.", jt.raw);
  else if (jt.fix) addFix(issues, excelRow, L("jenisTransaksi"), jt.fix.from, jt.fix.to);

  const jp = normJenisPembayaran(get("jenisPembayaran"));
  if (!jp.value) err("jenisPembayaran", "JP_INVALID", "Jenis Pembayaran harus TT / SCF / SKBDN.", jp.raw);
  else if (jp.fix) addFix(issues, excelRow, L("jenisPembayaran"), jp.fix.from, jp.fix.to);

  const ps = normPosisiStatus(get("posisiDokumen"), get("statusDokumen"));
  if (!ps) {
    err("posisiDokumen", "POSISI_INVALID", "Posisi Dokumen harus Dokumen di Bendahara / Dokumen di Verifikasi / Belum Ditagihkan.",
      `${cellText(get("posisiDokumen"))} | ${cellText(get("statusDokumen"))}`);
  } else {
    const pRaw = cellText(get("posisiDokumen"));
    if (pRaw && pRaw !== ps.posisi) addFix(issues, excelRow, L("posisiDokumen"), pRaw, ps.posisi);
  }

  if (!ok || !ps || !kv.value || !jt.value || !jp.value || !postingDate || amountRaw == null) return null;

  const belumDitagihkan = ps.masalah === "Belum Ditagihkan";
  const due = resolveDueDate({ dueDate: dueDateFile, postingDate, top, belumDitagihkan, period: ctx.period });
  if (due.filled) issues.add({ row: excelRow, column: L("dueDate"), code: "DUE_FILLED", severity: "warning", suggestion: due.dueDate ?? undefined,
    message: belumDitagihkan ? "Due Date kosong → akhir bulan berikutnya (belum ditagihkan)." : "Due Date kosong → Posting Date + TOP." });
  const aging = deriveAging(ctx.period, due.dueDate, belumDitagihkan);

  // Kolom umur R–W dari OpCo: hanya dicek bila diisi.
  const bucketVals = TEMPLATE_BUCKET_KEYS.map(([k, name]) => [name, parseNumber(get(k)) ?? 0] as const);
  const bucketSum = bucketVals.reduce((s, [, v]) => s + v, 0);
  if (bucketVals.some(([, v]) => v !== 0)) {
    if (Math.abs(Math.abs(bucketSum) - Math.abs(amountRaw)) > 1) {
      err("total", "BUCKET_SUM", `Total R–W (${fmt(bucketSum)}) ≠ Amount (${fmt(amountRaw)}).`, bucketSum, "Pastikan nilai Amount hanya diletakkan pada satu kolom umur.");
      return null;
    }
    const filed = bucketVals.find(([, v]) => v !== 0)?.[0];
    if (filed && filed !== aging.bucket) {
      issues.add({ row: excelRow, column: "R–W", code: "BUCKET_DIFF", severity: "warning", value: filed, suggestion: aging.bucket,
        message: `File menempatkan di "${filed}", hitungan sistem "${aging.bucket}" (umur ${aging.umur ?? "-"} hari). Sistem memakai hitungan sistem.` });
    }
  }

  return {
    row: excelRow,
    cocd,
    vendorName,
    top,
    docNumber,
    invoiceNumber: cellText(get("invoice")) || null,
    description: cellText(get("description")) || null,
    documentDate,
    postingDate,
    dueDate: due.dueDate,
    amount,
    kategoriVendor: kv.value,
    kategoriTransaksi: kategoriTransaksi ?? expectedKategoriTransaksi(kv.value),
    jenisTransaksi: jt.value,
    jenisPembayaran: jp.value,
    posisiDokumen: ps.posisi,
    statusDokumen: ps.status,
    masalahDashboard: ps.masalah,
    rangeTop: aging.rangeTop,
    jatuhTempo2: aging.jatuhTempo2,
    umur: aging.umur,
    bucket: aging.bucket,
    keteranganMasalah: cellText(get("ketMasalah")) || null,
    keteranganLain: cellText(get("ketLain")) || null,
  };
}

const fmt = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 2 });

/** Cek duplikat persis: CoCd + Doc. Number + tahun posting + vendor + amount. */
export function checkDuplicates(rows: StdRow[], issues: IssueCollector) {
  const seen = new Map<string, number>();
  for (const r of rows) {
    const k = `${r.cocd}|${r.docNumber}|${r.postingDate.slice(0, 4)}|${r.vendorName}|${r.amount}|${r.invoiceNumber ?? ""}`;
    const first = seen.get(k);
    if (first != null) {
      issues.add({ row: r.row, column: "E", code: "DUPLICATE", severity: "error", value: r.docNumber,
        message: `Sama dengan baris ${first} (Doc. ${r.docNumber}).`, suggestion: "Hapus salah satu baris." });
    } else seen.set(k, r.row);
  }
}

export type ValidationResult = {
  rows: StdRow[];
  issues: IssueGroup[];
  errorCount: number;
  warningCount: number;
  totalRows: number;
  totalAmount: number;
  map: ColumnMap | null;
  firstDataRow: number;
  flipSign: boolean;
};

/** Validasi seluruh sheet `Detail` (grid[0] = baris Excel 1). */
export function validateGrid(grid: unknown[][], base: Omit<Ctx, "flipSign">, sampleLimit = SAMPLE_LIMIT): ValidationResult {
  const issues = new IssueCollector(sampleLimit);
  const det = detectColumns(grid, issues);
  if (!det || issues.errorCount) {
    return { rows: [], issues: issues.list(), errorCount: issues.errorCount, warningCount: issues.warningCount, totalRows: 0, totalAmount: 0, map: det?.map ?? null, firstDataRow: det?.firstDataRow ?? FIRST_DATA_ROW, flipSign: false };
  }
  checkPeriodCell(grid, base.period, issues);
  const flipSign = decideFlipSign(grid, det.map, det.firstDataRow);
  const ctx: Ctx = { ...base, flipSign };
  const rows: StdRow[] = [];
  let totalRows = 0;
  for (let r = det.firstDataRow - 1; r < grid.length; r++) {
    const cells = grid[r];
    if (isBlankRow(cells)) continue;
    const vendorCell = det.map.vendor != null ? cellText(cells[det.map.vendor]) : "";
    if (/^(grand\s*)?total$/i.test(vendorCell)) continue;
    totalRows++;
    const std = validateRow(cells, r + 1, det.map, ctx, issues);
    if (std) rows.push(std);
  }
  if (!totalRows) issues.add({ row: det.firstDataRow, column: null, code: "EMPTY_FILE", severity: "error", message: `Tidak ada data mulai baris ${det.firstDataRow}.` });
  if (flipSign) issues.add({ row: null, column: "K", code: "AMOUNT_SIGN", severity: "warning", message: "Amount bertanda negatif (format SAP) dibalik menjadi positif." });
  checkDuplicates(rows, issues);
  return {
    rows, issues: issues.list(), errorCount: issues.errorCount, warningCount: issues.warningCount, totalRows,
    totalAmount: rows.reduce((s, r) => s + r.amount, 0), map: det.map, firstDataRow: det.firstDataRow, flipSign,
  };
}
