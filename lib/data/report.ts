import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { apSummary, apVendorSummary, opcos, periods, submissions, trendMonthly } from "@/db/schema";
import type { Bucket, KategoriVendor } from "@/lib/rules/constants";
import { endOfMonth } from "@/lib/rules/derive";

export type Cat = KategoriVendor;
export const EX_INTERCO: Cat[] = ["Third Parties", "Afiliasi", "BUMN"];

type SumRow = { opcoCode: string; kategoriVendor: string; jenisTransaksi: string; jenisPembayaran: string; masalahDashboard: string; bucket: string; amount: number };

export type Section = {
  key: string;
  title: string;
  cats: Cat[];
  total: number;
  status: { cleanClear: number; verifikasi: number; belumDitagihkan: number };
  payment: { TT: number; SCF: number; SKBDN: number };
  buckets: Record<Bucket, number>;
  byOpco: { code: string; name: string; amount: number; buckets: Record<Bucket, number> }[];
  byCat: { cat: Cat; amount: number }[];
  topVendors: { name: string; amount: number; opcoCode?: string }[];
  trend: { period: string; amount: number }[];
  mom: number | null; // perubahan vs bulan lalu (rasio)
  ytd: number | null; // perubahan vs Desember tahun lalu (rasio)
};

export type Report = {
  period: string;
  scope: string | null; // null = seluruh grup; selain itu kode OpCo (akun OpCo)
  prevPeriod: string;
  decPeriod: string;
  opcoNames: Record<string, string>;
  konsolidasi: Section;
  thirdParties: Section;
  afiliasi: Section;
  bumn: Section;
  interco: Section;
  opcoOrder: string[]; // urutan slide OpCo: total non-Interco terbesar
  perOpco: Record<string, { total: number; tp: Section; bumn: Section; afiliasi: Section }>;
  intercoOver365: { code: string; amount: number; vendors: { name: string; amount: number }[] }[];
  submissionsCount: number;
  updatedAt: string | null;
};

const emptyBuckets = (): Record<Bucket, number> => ({
  "Belum Jatuh Tempo": 0, "1-45 hari": 0, "46-135 hari": 0, "136-365 hari": 0, "> 365 hari": 0,
});

/** Lingkup OpCo untuk query laporan: null/undefined = seluruh grup. */
export type Scope = { opco?: string | null };

export async function listPeriods({ opco }: Scope = {}) {
  const rows = await db.execute<{ period: string; has_detail: boolean; status: string }>(sql`
    select p.period::text period, p.status::text status,
      exists(select 1 from ${apSummary} s where s.period = p.period ${opco ? sql`and s.opco_code = ${opco}` : sql``}) has_detail
    from ${periods} p order by p.period desc`);
  return rows.rows.map((r) => ({ period: r.period, status: r.status as "open" | "locked", hasDetail: r.has_detail }));
}

export async function latestPeriod({ opco }: Scope = {}) {
  const [r] = await db.select({ period: apSummary.period }).from(apSummary)
    .where(opco ? eq(apSummary.opcoCode, opco) : undefined).orderBy(desc(apSummary.period)).limit(1);
  return r?.period ?? null;
}

/** Total per (periode, kategori[, opco]) untuk tren: ringkasan detail bila ada, selain itu data historis. */
async function trendTotals(from: string, to: string, opco: string | null) {
  const live = await db.execute<{ period: string; opco_code: string; kategori_vendor: string; amount: string }>(sql`
    select period::text, opco_code, kategori_vendor, sum(amount)::text amount from ${apSummary}
    where period between ${from} and ${to} ${opco ? sql`and opco_code = ${opco}` : sql``} group by 1, 2, 3`);
  const livePeriods = new Set(live.rows.map((r) => r.period));
  const hist = await db.select().from(trendMonthly)
    .where(and(gte(trendMonthly.period, from), lte(trendMonthly.period, to), opco ? eq(trendMonthly.opcoCode, opco) : undefined));
  const out: { period: string; opcoCode: string; kategoriVendor: string; amount: number }[] =
    live.rows.map((r) => ({ period: r.period, opcoCode: r.opco_code, kategoriVendor: r.kategori_vendor, amount: Number(r.amount) }));
  for (const h of hist) if (!livePeriods.has(h.period)) out.push(h);
  return out;
}

export async function buildReport(period: string, { opco = null }: Scope = {}): Promise<Report> {
  const prevPeriod = endOfMonth(period, -1);
  const decPeriod = `${Number(period.slice(0, 4)) - 1}-12-31`;

  const [rows, opcoRows, vendorRows, trendRows, subStats] = await Promise.all([
    db.select({
      opcoCode: apSummary.opcoCode, kategoriVendor: apSummary.kategoriVendor, jenisTransaksi: apSummary.jenisTransaksi,
      jenisPembayaran: apSummary.jenisPembayaran, masalahDashboard: apSummary.masalahDashboard, bucket: apSummary.bucket, amount: apSummary.amount,
    }).from(apSummary).where(and(eq(apSummary.period, period), opco ? eq(apSummary.opcoCode, opco) : undefined)) as Promise<SumRow[]>,
    db.select().from(opcos).where(opco ? eq(opcos.code, opco) : undefined).orderBy(asc(opcos.sortOrder)),
    db.select().from(apVendorSummary).where(and(eq(apVendorSummary.period, period), opco ? eq(apVendorSummary.opcoCode, opco) : undefined)),
    trendTotals(decPeriod, period, opco),
    db.execute<{ n: number; at: string | null }>(sql`select count(*)::int n, max(finalized_at)::text at from ${submissions}
      where period = ${period} and status = 'active' ${opco ? sql`and opco_code = ${opco}` : sql``}`),
  ]);

  const opcoNames = Object.fromEntries(opcoRows.map((o) => [o.code, o.name]));
  const months: string[] = [];
  for (let p = decPeriod; p <= period; p = endOfMonth(p, 1)) months.push(p);

  const section = (key: string, title: string, cats: Cat[], opco?: string): Section => {
    const rs = rows.filter((r) => cats.includes(r.kategoriVendor as Cat) && (!opco || r.opcoCode === opco));
    const sum = (f: (r: SumRow) => boolean) => rs.filter(f).reduce((s, r) => s + r.amount, 0);
    const buckets = emptyBuckets();
    for (const r of rs) buckets[r.bucket as Bucket] = (buckets[r.bucket as Bucket] ?? 0) + r.amount;
    const byOpcoMap = new Map<string, number>();
    const byOpcoBuckets = new Map<string, Record<Bucket, number>>();
    for (const r of rs) {
      byOpcoMap.set(r.opcoCode, (byOpcoMap.get(r.opcoCode) ?? 0) + r.amount);
      const b = byOpcoBuckets.get(r.opcoCode) ?? emptyBuckets();
      b[r.bucket as Bucket] = (b[r.bucket as Bucket] ?? 0) + r.amount;
      byOpcoBuckets.set(r.opcoCode, b);
    }
    const vendors = new Map<string, { name: string; amount: number; opcoCode?: string }>();
    for (const v of vendorRows) {
      if (!cats.includes(v.kategoriVendor as Cat) || (opco && v.opcoCode !== opco)) continue;
      const k = opco ? v.vendorName : v.vendorName.toLowerCase();
      const cur = vendors.get(k) ?? { name: v.vendorName, amount: 0 };
      cur.amount += v.amount;
      vendors.set(k, cur);
    }
    const trend = months.map((m) => ({
      period: m,
      amount: trendRows.filter((t) => t.period === m && cats.includes(t.kategoriVendor as Cat) && (!opco || t.opcoCode === opco)).reduce((s, t) => s + t.amount, 0),
    }));
    const total = rs.reduce((s, r) => s + r.amount, 0);
    const at = (p: string) => trend.find((t) => t.period === p)?.amount ?? 0;
    const ratio = (base: number) => (base ? (total - base) / base : null);
    return {
      key, title, cats, total,
      status: {
        cleanClear: sum((r) => r.masalahDashboard === "Clean & Clear"),
        verifikasi: sum((r) => r.masalahDashboard === "Proses Verifikasi Tagihan"),
        belumDitagihkan: sum((r) => r.masalahDashboard === "Belum Ditagihkan"),
      },
      payment: { TT: sum((r) => r.jenisPembayaran === "TT"), SCF: sum((r) => r.jenisPembayaran === "SCF"), SKBDN: sum((r) => r.jenisPembayaran === "SKBDN") },
      buckets,
      byOpco: [...byOpcoMap].map(([code, amount]) => ({ code, name: opcoNames[code] ?? code, amount, buckets: byOpcoBuckets.get(code)! })).sort((a, b) => b.amount - a.amount),
      byCat: cats.map((cat) => ({ cat, amount: rs.filter((r) => r.kategoriVendor === cat).reduce((s, r) => s + r.amount, 0) })),
      topVendors: [...vendors.values()].sort((a, b) => b.amount - a.amount).slice(0, 10),
      trend,
      mom: ratio(at(prevPeriod)),
      ytd: ratio(at(decPeriod)),
    };
  };

  const who = opco ?? "SIG";
  const konsolidasi = section("konsolidasi", `Utang Usaha ${who} Konsolidasi`, EX_INTERCO);
  const opcoOrder = konsolidasi.byOpco.filter((o) => o.amount > 0).map((o) => o.code);
  const allCodes = new Set(rows.map((r) => r.opcoCode));
  for (const o of opcoRows) if (allCodes.has(o.code) && !opcoOrder.includes(o.code)) opcoOrder.push(o.code);

  const perOpco: Report["perOpco"] = {};
  for (const code of opcoOrder) {
    const tp = section(`opco-${code}-tp`, "Pihak Ketiga", ["Third Parties"], code);
    const bumn = section(`opco-${code}-bumn`, "BUMN", ["BUMN"], code);
    const af = section(`opco-${code}-af`, "Afiliasi", ["Afiliasi"], code);
    perOpco[code] = { total: tp.total + bumn.total + af.total, tp, bumn, afiliasi: af };
  }

  const over365 = new Map<string, { code: string; amount: number; vendors: { name: string; amount: number }[] }>();
  for (const v of vendorRows) {
    if (v.kategoriVendor !== "Interco" || v.over365 <= 0) continue;
    const cur = over365.get(v.opcoCode) ?? { code: v.opcoCode, amount: 0, vendors: [] };
    cur.amount += v.over365;
    cur.vendors.push({ name: v.vendorName, amount: v.over365 });
    over365.set(v.opcoCode, cur);
  }
  const intercoOver365 = [...over365.values()].sort((a, b) => b.amount - a.amount)
    .map((o) => ({ ...o, vendors: o.vendors.sort((a, b) => b.amount - a.amount).slice(0, 8) }));

  return {
    period, scope: opco, prevPeriod, decPeriod, opcoNames,
    konsolidasi,
    thirdParties: section("pihak-ketiga", `Utang Usaha ${who} ke Pihak Ketiga`, ["Third Parties"]),
    afiliasi: section("afiliasi", `Utang Usaha ${who} ke Afiliasi`, ["Afiliasi"]),
    bumn: section("bumn", `Utang Usaha ${who} ke BUMN`, ["BUMN"]),
    interco: section("interco", `Utang Usaha Interco ${who}`, ["Interco"]),
    opcoOrder, perOpco, intercoOver365,
    submissionsCount: subStats.rows[0]?.n ?? 0,
    updatedAt: subStats.rows[0]?.at ?? null,
  };
}

/** Status unggahan seluruh OpCo untuk sebuah periode (matriks monitoring). */
export async function uploadMatrix(period: string, { opco }: Scope = {}) {
  const [allOpcos, subs] = await Promise.all([
    db.select().from(opcos).where(and(eq(opcos.active, true), opco ? eq(opcos.code, opco) : undefined)).orderBy(asc(opcos.sortOrder)),
    db.select().from(submissions).where(and(eq(submissions.period, period), opco ? eq(submissions.opcoCode, opco) : undefined)).orderBy(desc(submissions.createdAt)),
  ]);
  return allOpcos.map((o) => {
    const mine = subs.filter((s) => s.opcoCode === o.code);
    return { opco: o, latest: mine[0] ?? null, active: mine.find((s) => s.status === "active") ?? null, history: mine };
  });
}


