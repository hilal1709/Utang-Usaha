import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { PageHeader, PeriodSelect } from "@/components/shell/page-header";
import { Banner } from "@/components/feedback/banner";
import { listPeriods, uploadMatrix } from "@/lib/data/report";
import { endOfMonth } from "@/lib/rules/derive";
import { monthLabel } from "@/lib/format";
import { MonitoringTable } from "./monitoring-table";
import { LockToggle } from "./lock-toggle";
import { KpiTile } from "@/components/dashboard/kpi";

export const metadata: Metadata = { title: "Monitoring OpCo" };

export default async function MonitoringPage({ searchParams }: PageProps<"/cms/monitoring">) {
  await requireUser(["ADMIN"]);
  const sp = await searchParams;
  const periods = await listPeriods();
  const fallback = endOfMonth(new Date().toISOString().slice(0, 10), -1);
  const all = periods.some((p) => p.period === fallback) ? periods : [{ period: fallback, status: "open" as const, hasDetail: false }, ...periods];
  const period = typeof sp.period === "string" && all.some((p) => p.period === sp.period) ? sp.period : fallback;
  const status = all.find((p) => p.period === period)?.status ?? "open";
  const matrix = await uploadMatrix(period);
  const active = matrix.filter((m) => m.active).length;
  const rows = matrix.reduce((n, m) => n + (m.active?.rowCount ?? 0), 0);
  const total = matrix.reduce((n, m) => n + (m.active?.totalAmount ?? 0), 0);
  const attention = matrix.filter((m) => !m.active || m.latest?.status === "rejected").length;

  return (
    <>
      <PageHeader
        title="Monitoring unggahan OpCo"
        description={<>{monthLabel(period)} · {active} dari {matrix.length} OpCo sudah aktif</>}
        actions={<><PeriodSelect periods={all} value={period} /><LockToggle period={period} locked={status === "locked"} /></>}
      />
      <div className="space-y-5 px-4 pb-14 sm:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile tone="lightblue" label="OpCo aktif" value={active} unit="count" suffix={`/ ${matrix.length}`} note="versi aktif periode ini" />
          <KpiTile tone="steel" label="Baris data aktif" value={rows} unit="count" note="seluruh OpCo" />
          <KpiTile tone="ebony" label="Total utang (semua kategori)" value={total} note="termasuk Interco" />
          <KpiTile tone="pollen" label="Perlu tindak lanjut" value={attention} unit="count" suffix="OpCo" note="belum unggah atau ditolak" />
        </div>
        {status === "locked" && <Banner tone="locked" title="Periode dikunci">OpCo tidak dapat mengunggah atau mengganti data {monthLabel(period)}. Buka kunci bila ada koreksi.</Banner>}
        <div className="glass-solid rounded-2xl p-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold text-ink">Kelengkapan periode</p>
            <p className="num text-sm text-ink-soft">{active}/{matrix.length}</p>
          </div>
          <div className="mt-3 flex gap-1" aria-hidden>
            {matrix.map((m) => (
              <span key={m.opco.code} title={`${m.opco.code}: ${m.active ? "aktif" : m.latest?.status ?? "belum unggah"}`}
                className={`h-3 flex-1 rounded-[4px] ${m.active ? "bg-[#b9d8c2]" : m.latest?.status === "rejected" ? "bg-[#ff8f80]" : m.latest?.status === "validating" ? "bg-[#ffcb47]" : "bg-white/15"}`} />
            ))}
          </div>
        </div>
        <MonitoringTable period={period} rows={matrix.map((m) => ({
          code: m.opco.code, name: m.opco.name,
          latest: m.latest && { id: m.latest.id, status: m.latest.status, version: m.latest.version, fileName: m.latest.fileName, rowCount: m.latest.rowCount, errorCount: m.latest.errorCount, warningCount: m.latest.warningCount, createdAt: m.latest.createdAt.toISOString(), source: m.latest.source },
          activeTotal: m.active?.totalAmount ?? null, activeVersion: m.active?.version ?? null,
        }))} />
      </div>
    </>
  );
}
