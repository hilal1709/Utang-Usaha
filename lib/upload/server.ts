import { and, eq, inArray, sql, desc, max } from "drizzle-orm";
import { isAdmin } from "@/lib/access";
import type { Role } from "@/auth.config";
import { db } from "@/db";
import { apDetail, apSummary, apVendorSummary, dataEvents, opcos, periods, submissionIssues, submissions, vendorMaster } from "@/db/schema";
import { IssueCollector, validateRow, type ColumnMap, type IssueGroup, type StdRow, type VendorLookup } from "@/lib/validation";

const INSERT_CHUNK = 1500;

let vendorCache: { at: number; map: Map<string, { standardName: string; kategoriVendor: string | null }> } | null = null;

export async function getVendorLookup(): Promise<VendorLookup> {
  if (!vendorCache || Date.now() - vendorCache.at > 60_000) {
    const rows = await db.select().from(vendorMaster);
    vendorCache = { at: Date.now(), map: new Map(rows.map((r) => [r.key, { standardName: r.standardName, kategoriVendor: r.kategoriVendor }])) };
  }
  const m = vendorCache.map;
  return (k) => m.get(k);
}
export const invalidateVendorCache = () => { vendorCache = null; };

export async function emitEvent(kind: string, message: string, period?: string | null, opcoCode?: string | null) {
  await db.insert(dataEvents).values({ kind, message, period: period ?? null, opcoCode: opcoCode ?? null });
}

export async function ensurePeriod(period: string) {
  await db.insert(periods).values({ period }).onConflictDoNothing();
  const [p] = await db.select().from(periods).where(eq(periods.period, period));
  return p;
}

export async function startSubmission(o: {
  period: string; opcoCode: string; fileName: string; uploadedBy: string | null; expectedRows: number; flipSign: boolean; columnMap: ColumnMap; source?: string; note?: string;
}) {
  const p = await ensurePeriod(o.period);
  if (p.status === "locked") throw new UploadError("Periode sudah dikunci oleh admin. Hubungi Treasury untuk membuka kembali.");
  const [opco] = await db.select().from(opcos).where(eq(opcos.code, o.opcoCode));
  if (!opco) throw new UploadError(`OpCo ${o.opcoCode} tidak terdaftar.`);
  const [{ v }] = await db.select({ v: max(submissions.version) }).from(submissions)
    .where(and(eq(submissions.period, o.period), eq(submissions.opcoCode, o.opcoCode)));
  const [sub] = await db.insert(submissions).values({
    opcoCode: o.opcoCode, period: o.period, version: (v ?? 0) + 1, fileName: o.fileName, uploadedBy: o.uploadedBy,
    expectedRows: o.expectedRows, flipSign: o.flipSign, columnMap: o.columnMap as Record<string, number>, source: o.source ?? "upload", note: o.note,
  }).returning();
  await emitEvent("upload_started", `${opco.code} mulai mengunggah ${o.fileName}`, o.period, o.opcoCode);
  return { submission: sub, opco };
}

export class UploadError extends Error {}

export async function getSubmissionFor(id: number, user: { role: Role; opcoCode: string | null }) {
  const [sub] = await db.select().from(submissions).where(eq(submissions.id, id));
  if (!sub) throw new UploadError("Submission tidak ditemukan.");
  if (!isAdmin(user.role) && sub.opcoCode !== user.opcoCode) throw new UploadError("Tidak berhak atas submission ini.");
  return sub;
}

/** Validasi ulang (otoritatif) satu batch baris mentah lalu simpan baris yang lolos. */
export async function ingestBatch(sub: typeof submissions.$inferSelect, batch: { r: number; c: unknown[] }[], allowedCocds: string[]) {
  if (sub.status !== "validating") throw new UploadError("Submission sudah selesai diproses.");
  const issues = new IssueCollector();
  const ctx = { period: sub.period, allowedCocds, flipSign: sub.flipSign, vendorLookup: await getVendorLookup() };
  const map = (sub.columnMap ?? {}) as ColumnMap;
  const rows: StdRow[] = [];
  for (const { r, c } of batch) {
    const std = validateRow(c, r, map, ctx, issues);
    if (std) rows.push(std);
  }
  await insertDetail(sub, rows);
  await saveIssues(sub.id, issues.list(), 50);
  await db.update(submissions).set({
    rowCount: sql`${submissions.rowCount} + ${rows.length}`,
    totalAmount: sql`${submissions.totalAmount} + ${rows.reduce((s, x) => s + x.amount, 0)}`,
    errorCount: sql`${submissions.errorCount} + ${issues.errorCount}`,
    warningCount: sql`${submissions.warningCount} + ${issues.warningCount}`,
  }).where(eq(submissions.id, sub.id));
  return { accepted: rows.length, errors: issues.errorCount, warnings: issues.warningCount };
}

export async function insertDetail(sub: { id: number; period: string; opcoCode: string }, rows: StdRow[]) {
  for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
    await db.insert(apDetail).values(rows.slice(i, i + INSERT_CHUNK).map((r) => ({ ...r, submissionId: sub.id, period: sub.period, opcoCode: sub.opcoCode })));
  }
}

export async function saveIssues(submissionId: number, groups: IssueGroup[], perCode = 300) {
  const values = groups.flatMap((g) => g.samples.slice(0, perCode).map((i) => ({
    submissionId, row: i.row, column: i.column, code: i.code, message: i.message, severity: i.severity,
    value: i.value?.slice(0, 500) ?? null, suggestion: i.suggestion?.slice(0, 500) ?? null,
  })));
  for (let i = 0; i < values.length; i += 2000) await db.insert(submissionIssues).values(values.slice(i, i + 2000));
}

/**
 * Finalisasi: cek duplikat lintas batch, lalu (bila bersih) jadikan versi aktif, buang detail versi lama,
 * dan bangun ulang ringkasan (periode, opco). Semua dalam satu transaksi.
 */
export async function finalizeSubmission(subId: number, fileIssues: IssueGroup[]) {
  const [sub] = await db.select().from(submissions).where(eq(submissions.id, subId));
  if (!sub || sub.status !== "validating") throw new UploadError("Submission tidak dalam status validasi.");
  if (fileIssues.length) await saveIssues(sub.id, fileIssues);
  const fileErrors = fileIssues.filter((g) => g.severity === "error").reduce((s, g) => s + g.count, 0);
  const fileWarnings = fileIssues.filter((g) => g.severity === "warning").reduce((s, g) => s + g.count, 0);

  const dups = await db.execute<{ row: number; first: number; doc_number: string }>(sql`
    select row, first_value(row) over w as first, doc_number from (
      select row, doc_number, cocd, extract(year from posting_date) y, vendor_name, amount, coalesce(invoice_number,'') inv
      from ap_detail where submission_id = ${sub.id}
    ) t window w as (partition by cocd, doc_number, y, vendor_name, amount, inv order by row)
    order by row`);
  const dupRows = dups.rows.filter((r) => r.row !== r.first);
  if (dupRows.length) {
    await db.insert(submissionIssues).values(dupRows.slice(0, 300).map((d) => ({
      submissionId: sub.id, row: d.row, column: "E", code: "DUPLICATE", severity: "error" as const, value: d.doc_number,
      message: `Sama dengan baris ${d.first} (Doc. ${d.doc_number}).`, suggestion: "Hapus salah satu baris.",
    })));
  }
  const errorCount = sub.errorCount + fileErrors + dupRows.length;
  const missing = errorCount === 0 && sub.expectedRows > 0 && sub.rowCount !== sub.expectedRows;

  if (errorCount > 0 || missing) {
    await db.transaction(async (tx) => {
      await tx.delete(apDetail).where(eq(apDetail.submissionId, sub.id));
      await tx.update(submissions).set({
        status: "rejected", errorCount: errorCount || 1, warningCount: sub.warningCount + fileWarnings, finalizedAt: new Date(),
        note: missing ? "Unggahan terputus: jumlah baris tidak lengkap." : sub.note,
      }).where(eq(submissions.id, sub.id));
      await tx.insert(dataEvents).values({ kind: "upload_rejected", message: `${sub.opcoCode}: unggahan ditolak (${errorCount} error)`, period: sub.period, opcoCode: sub.opcoCode });
    });
    return { status: "rejected" as const, errorCount };
  }

  await db.transaction(async (tx) => {
    const old = await tx.select({ id: submissions.id }).from(submissions)
      .where(and(eq(submissions.period, sub.period), eq(submissions.opcoCode, sub.opcoCode), eq(submissions.status, "active")));
    if (old.length) {
      const ids = old.map((o) => o.id);
      await tx.delete(apDetail).where(inArray(apDetail.submissionId, ids));
      await tx.update(submissions).set({ status: "superseded" }).where(inArray(submissions.id, ids));
    }
    await tx.update(submissions).set({ status: "active", warningCount: sub.warningCount + fileWarnings, finalizedAt: new Date() }).where(eq(submissions.id, sub.id));
    await rebuildSummary(tx, sub.period, sub.opcoCode, sub.id);
    await tx.insert(dataEvents).values({ kind: "data_updated", message: `Data ${sub.opcoCode} versi ${sub.version} aktif`, period: sub.period, opcoCode: sub.opcoCode });
  });
  return { status: "active" as const, errorCount: 0 };
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function rebuildSummary(tx: Tx | typeof db, period: string, opcoCode: string, submissionId: number) {
  await tx.delete(apSummary).where(and(eq(apSummary.period, period), eq(apSummary.opcoCode, opcoCode)));
  await tx.delete(apVendorSummary).where(and(eq(apVendorSummary.period, period), eq(apVendorSummary.opcoCode, opcoCode)));
  await tx.execute(sql`
    insert into ap_summary (period, opco_code, kategori_vendor, jenis_transaksi, jenis_pembayaran, masalah_dashboard, bucket, amount, rows)
    select period, opco_code, kategori_vendor, jenis_transaksi, jenis_pembayaran, masalah_dashboard, bucket, sum(amount), count(*)
    from ap_detail where submission_id = ${submissionId}
    group by period, opco_code, kategori_vendor, jenis_transaksi, jenis_pembayaran, masalah_dashboard, bucket`);
  await tx.execute(sql`
    insert into ap_vendor_summary (period, opco_code, kategori_vendor, vendor_name, amount, over365)
    select period, opco_code, kategori_vendor, vendor_name, sum(amount), sum(case when bucket = '> 365 hari' then amount else 0 end)
    from ap_detail where submission_id = ${submissionId}
    group by period, opco_code, kategori_vendor, vendor_name`);
}

export async function listSubmissions(period: string, opcoCode?: string) {
  const where = opcoCode ? and(eq(submissions.period, period), eq(submissions.opcoCode, opcoCode)) : eq(submissions.period, period);
  return db.select().from(submissions).where(where).orderBy(desc(submissions.createdAt));
}
