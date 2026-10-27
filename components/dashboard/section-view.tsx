import Link from "next/link";
import { HBarChart, PaymentBars, StatusDonut, TrendChart } from "@/components/charts/charts";
import { StrataBar, StrataLegend } from "@/components/charts/strata";
import { KpiTile } from "@/components/dashboard/kpi";
import { EmptyNote, Panel } from "@/components/dashboard/panel";
import type { Report, Section } from "@/lib/data/report";
import { milyar, milyarAuto, share } from "@/lib/format";
import { kesimpulan } from "@/lib/narrative";
import { OVERDUE_BUCKETS } from "@/lib/rules/constants";

const STATUS_ROWS = [
  { key: "cleanClear", label: "Clean & Clear", color: "#f5ee9e" },
  { key: "verifikasi", label: "Proses Verifikasi", color: "#f49e4c" },
  { key: "belumDitagihkan", label: "Belum Ditagihkan", color: "rgba(255,255,255,0.85)" },
] as const;

/** Tampilan standar satu kategori (setara slide 3–6 PPT) yang dipakai halaman Konsolidasi, Pihak Ketiga, Afiliasi, BUMN, Interco. */
export function SectionView({ report, section, subject, showCategory = false }: { report: Report; section: Section; subject: string; showCategory?: boolean }) {
  const s = section;
  const overdue = OVERDUE_BUCKETS.reduce((sum, b) => sum + (s.buckets[b] ?? 0), 0);
  const lines = kesimpulan(subject, s, report.period, report.prevPeriod, report.decPeriod);
  const prevLabel = "vs bulan lalu";

  return (
    <div className="space-y-5 px-4 pb-12 sm:px-8">
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4 xl:grid-cols-4 2xl:gap-5">
        <KpiTile tone="cyan" label="Total utang usaha" value={s.total} delta={s.mom} deltaLabel={prevLabel} />
        <KpiTile tone="vanilla" label="Clean & Clear" value={s.status.cleanClear} note={`${share(s.status.cleanClear, s.total)} dari total · siap bayar`} />
        <KpiTile tone="sandy" label="Belum ditagihkan" value={s.status.belumDitagihkan} note={`${share(s.status.belumDitagihkan, s.total)} dari total`} />
        <KpiTile tone="brick" label="Telah jatuh tempo" value={overdue} note={`${share(overdue, s.total)} dari total · > 365 hari Rp ${milyar(s.buckets["> 365 hari"])} M`} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel title="Tren kenaikan / penurunan" className="xl:col-span-2"
          action={<span className="num text-xs font-medium text-ink-soft">vs Des: {s.ytd == null ? "–" : `${s.ytd >= 0 ? "+" : ""}${(s.ytd * 100).toLocaleString("id-ID", { maximumFractionDigits: 2 })}%`}</span>}>
          <TrendChart points={s.trend} />
        </Panel>
        <Panel title="Status tagihan">
          <StatusDonut status={s.status} center={<div><p className="text-[0.7rem] font-medium text-ink-soft">Total</p><p className="num text-xl font-semibold text-ink">{milyar(s.total)}</p></div>} />
          <ul className="mt-4 space-y-2">
            {STATUS_ROWS.map((r) => (
              <li key={r.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-ink"><span className="size-2.5 rounded-[3px] ring-1 ring-white/30" style={{ background: r.color }} />{r.label}</span>
                <span className="num font-semibold text-ink">{milyar(s.status[r.key])} <span className="text-xs font-medium text-ink-soft">{share(s.status[r.key], s.total)}</span></span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Umur utang — lapisan dari segar ke paling tua" id="strata" reveal>
        <StrataBar buckets={s.buckets} height={30} label="Seluruh entitas" />
        <div className="mt-4"><StrataLegend buckets={s.buckets} /></div>
        {s.byOpco.length > 1 && (
          <div className="mt-6 border-t border-border pt-4">
            <p className="mb-3 text-xs font-medium text-ink-soft">Per entitas, diurutkan dari saldo terbesar</p>
            <ul className="space-y-2.5">
              {s.byOpco.map((o) => (
                <li key={o.code} className="grid grid-cols-[3.5rem_minmax(0,1fr)_4.5rem] items-center gap-2.5 text-sm sm:grid-cols-[4.5rem_minmax(0,1fr)_5.5rem] sm:gap-3">
                  <Link href={`/dashboard/opco/${o.code}?period=${report.period}`} className="font-semibold text-ink hover:underline" title={o.name}>{o.code}</Link>
                  <StrataBar buckets={o.buckets} height={12} animate={false} label={o.name} />
                  <span className="num text-right font-medium text-ink">{milyarAuto(o.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {showCategory ? (
          <Panel title="Per kategori vendor" reveal>
            <HBarChart rows={s.byCat.map((c) => ({ label: c.cat === "Third Parties" ? "Pihak Ketiga" : c.cat, amount: c.amount }))} />
          </Panel>
        ) : (
          <Panel title="Jenis pembayaran" reveal><PaymentBars payment={s.payment} /></Panel>
        )}
        <Panel title="Utang per entitas" reveal>
          {s.byOpco.length ? <HBarChart rows={s.byOpco.slice(0, 10).map((o) => ({ label: o.code, amount: o.amount }))} /> : <EmptyNote>Belum ada data entitas.</EmptyNote>}
        </Panel>
        <Panel title="Top 10 vendor" reveal className="md:col-span-2 2xl:col-span-1">
          {s.topVendors.length ? <HBarChart rows={s.topVendors.map((v) => ({ label: v.name, amount: v.amount }))} digits={0} /> : <EmptyNote>Belum ada data vendor.</EmptyNote>}
        </Panel>
      </div>

      <section className="glass rounded-2xl px-4 py-4 sm:px-5" aria-label="Kesimpulan">
        <h2 className="text-[0.95rem] font-semibold text-ink">Kesimpulan</h2>
        <ul className="mt-2 space-y-1 text-sm leading-relaxed text-ink">
          {lines.map((l) => <li key={l}>{l}</li>)}
        </ul>
      </section>
    </div>
  );
}
