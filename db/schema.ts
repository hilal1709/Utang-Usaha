import {
  pgTable, pgEnum, text, integer, serial, bigserial, numeric, date, timestamp, uuid, index, primaryKey, boolean, jsonb,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["SUPERADMIN", "ADMIN", "OPCO", "VIEWER"]);
export const periodStatusEnum = pgEnum("period_status", ["open", "locked"]);
export const submissionStatusEnum = pgEnum("submission_status", ["validating", "rejected", "active", "superseded"]);
export const severityEnum = pgEnum("issue_severity", ["error", "warning"]);

const money = (name: string) => numeric(name, { precision: 22, scale: 2, mode: "number" });

export const opcos = pgTable("opcos", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(100),
  cocds: text("cocds").array().notNull().default([]),
  active: boolean("active").notNull().default(true),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("OPCO"),
  opcoCode: text("opco_code").references(() => opcos.code),
  active: boolean("active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Periode = tanggal akhir bulan laporan (mis. 2026-08-31). */
export const periods = pgTable("periods", {
  period: date("period").primaryKey(),
  status: periodStatusEnum("status").notNull().default("open"),
});

/** Master vendor: kunci = nama ternormalisasi (huruf kecil, tanpa PT/Tbk/tanda baca). */
export const vendorMaster = pgTable("vendor_master", {
  key: text("key").primaryKey(),
  standardName: text("standard_name").notNull(),
  kategoriVendor: text("kategori_vendor"),
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  opcoCode: text("opco_code").notNull().references(() => opcos.code),
  period: date("period").notNull(),
  version: integer("version").notNull(),
  status: submissionStatusEnum("status").notNull().default("validating"),
  source: text("source").notNull().default("upload"),
  fileName: text("file_name"),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  rowCount: integer("row_count").notNull().default(0),
  expectedRows: integer("expected_rows").notNull().default(0),
  totalAmount: money("total_amount").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  warningCount: integer("warning_count").notNull().default(0),
  flipSign: boolean("flip_sign").notNull().default(false),
  columnMap: jsonb("column_map").$type<Record<string, number>>(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  finalizedAt: timestamp("finalized_at", { withTimezone: true }),
}, (t) => [index("submissions_period_opco").on(t.period, t.opcoCode)]);

export const submissionIssues = pgTable("submission_issues", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  submissionId: integer("submission_id").notNull().references(() => submissions.id, { onDelete: "cascade" }),
  row: integer("row"),
  column: text("column"),
  code: text("code").notNull(),
  message: text("message").notNull(),
  severity: severityEnum("severity").notNull(),
  value: text("value"),
  suggestion: text("suggestion"),
}, (t) => [index("issues_submission").on(t.submissionId)]);

/** Baris detail terstandar (setara sheet `Source` pada file Gabungan). */
export const apDetail = pgTable("ap_detail", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  submissionId: integer("submission_id").notNull().references(() => submissions.id, { onDelete: "cascade" }),
  period: date("period").notNull(),
  opcoCode: text("opco_code").notNull(),
  row: integer("row"),
  cocd: text("cocd"),
  vendorName: text("vendor_name").notNull(),
  top: integer("top"),
  docNumber: text("doc_number"),
  invoiceNumber: text("invoice_number"),
  description: text("description"),
  documentDate: date("document_date"),
  postingDate: date("posting_date"),
  dueDate: date("due_date"),
  amount: money("amount").notNull(),
  kategoriVendor: text("kategori_vendor").notNull(),
  kategoriTransaksi: text("kategori_transaksi").notNull(),
  jenisTransaksi: text("jenis_transaksi").notNull(),
  jenisPembayaran: text("jenis_pembayaran").notNull(),
  posisiDokumen: text("posisi_dokumen").notNull(),
  statusDokumen: text("status_dokumen").notNull(),
  masalahDashboard: text("masalah_dashboard").notNull(),
  rangeTop: text("range_top").notNull(),
  jatuhTempo2: text("jatuh_tempo2").notNull(),
  umur: integer("umur"),
  bucket: text("bucket").notNull(),
  keteranganMasalah: text("keterangan_masalah"),
  keteranganLain: text("keterangan_lain"),
}, (t) => [index("detail_submission").on(t.submissionId)]);

/** Ringkasan untuk dashboard, dibangun ulang per (periode, opco) setiap ada versi aktif baru. */
export const apSummary = pgTable("ap_summary", {
  period: date("period").notNull(),
  opcoCode: text("opco_code").notNull(),
  kategoriVendor: text("kategori_vendor").notNull(),
  jenisTransaksi: text("jenis_transaksi").notNull(),
  jenisPembayaran: text("jenis_pembayaran").notNull(),
  masalahDashboard: text("masalah_dashboard").notNull(),
  bucket: text("bucket").notNull(),
  amount: money("amount").notNull(),
  rows: integer("rows").notNull(),
}, (t) => [index("summary_period").on(t.period, t.opcoCode)]);

export const apVendorSummary = pgTable("ap_vendor_summary", {
  period: date("period").notNull(),
  opcoCode: text("opco_code").notNull(),
  kategoriVendor: text("kategori_vendor").notNull(),
  vendorName: text("vendor_name").notNull(),
  amount: money("amount").notNull(),
  over365: money("over365").notNull(),
}, (t) => [index("vendor_summary_period").on(t.period, t.kategoriVendor)]);

/** Total bulanan historis (impor sheet `Tren`) — kategori: Third Parties/Afiliasi/BUMN/Interco. */
export const trendMonthly = pgTable("trend_monthly", {
  period: date("period").notNull(),
  opcoCode: text("opco_code").notNull(),
  kategoriVendor: text("kategori_vendor").notNull(),
  amount: money("amount").notNull(),
}, (t) => [primaryKey({ columns: [t.period, t.opcoCode, t.kategoriVendor] })]);

export const dataEvents = pgTable("data_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  period: date("period"),
  opcoCode: text("opco_code"),
  kind: text("kind").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

