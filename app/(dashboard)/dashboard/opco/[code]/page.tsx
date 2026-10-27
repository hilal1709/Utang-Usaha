import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader, PeriodSelect } from "@/components/shell/page-header";
import { NoData } from "@/components/dashboard/section-page";
import { ExportButton } from "@/components/dashboard/export-button";
import { Panel, EmptyNote } from "@/components/dashboard/panel";
import { HBarChart, PaymentBars } from "@/components/charts/charts";
import { StrataBar } from "@/components/charts/strata";
import { loadReport } from "@/lib/data/page-data";
import type { Section } from "@/lib/data/report";
import { milyarAuto, periodLabel, share } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/dashboard/opco/[code]">): Promise<Metadata> {
  return { title: (await params).code.toUpperCase() };
}

function StatusRow({ s }: { s: Section }) {
  const items = [
    { label: "Total", v: s.total, cls: "glass-tile text-white [--tile:#3b8ea5]" },
    { label: "Clean & Clear", v: s.status.cleanClear, cls: "glass-pill" },
    { label: "Proses Verifikasi", v: s.status.verifikasi, cls: "glass-pill" },
    { label: "Belum Ditagihkan", v: s.status.belumDitagihkan, cls: "glass-pill" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((i) => (
        <div key={i.label} className={`rounded-2xl px-3.5 py-3 ${i.cls}`}>
          <p className="text-[0.7rem] font-medium opacity-80">{i.label}</p>
          <p className="num mt-0.5 text-base font-semibold tracking-[-0.02em] sm:text-lg">{milyarAuto(i.v)}</p>
        </div>
      ))}
    </div>
  );
}

function Block({ title, s }: { title: string; s: Section }) {
  return (
    <section className="space-y-4" aria-label={title}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-lg font-semibold tracking-[-0.015em] text-ink">{title}</h2>
        <span className="text-xs text-ink-soft">Status tagihan, Milyar Rp</span>
      </div>
      <StatusRow s={s} />
      <StrataBar buckets={s.buckets} height={12} animate={false} label={title} />
      <div className="grid grid-cols-1 gap-4 md:max-lg:grid-cols-[1fr_1.6fr] xl:grid-cols-[1fr_1.6fr]">
        <Panel title="Jenis pembayaran"><PaymentBars payment={s.payment} height={180} /></Panel>
        <Panel title="Top 10 vendor">
          {s.topVendors.length ? <HBarChart rows={s.topVendors.map((v) => ({ label: v.name, amount: v.amount }))} digits={2} /> : <EmptyNote>Tidak ada saldo.</EmptyNote>}
        </Panel>
      </div>
    </section>
  );
}

export default async function Page({ params, searchParams }: PageProps<"/dashboard/opco/[code]">) {
  const code = (await params).code.toUpperCase();
  const { period, periods, report } = await loadReport(searchParams);
  if (report?.scope && report.scope !== code) notFound(); // akun OpCo tidak boleh membuka OpCo lain
  if (!period || !report) return <NoData />;
  const o = report.perOpco[code];
  if (!o) notFound();
  const name = report.opcoNames[code] ?? code;
  return (
    <>
      {!report.scope && (
        <div className="px-4 pt-5 sm:px-8">
          <Link href={`/dashboard/opco?period=${period}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
            <ArrowLeft className="size-4" /> Semua OpCo
          </Link>
        </div>
      )}
      <PageHeader title={name} description={<>Per {periodLabel(period)} · total di luar Interco Rp {milyarAuto(o.total)} M · Pihak Ketiga {share(o.tp.total, o.total)}</>}
        actions={<><PeriodSelect periods={periods} value={period} /><ExportButton period={period} variant="outline" /></>} />
      <div className="space-y-10 px-4 pb-14 sm:px-8">
        <Block title="Utang usaha ke Pihak Ketiga" s={o.tp} />
        <Block title="Utang usaha ke BUMN" s={o.bumn} />
        <Block title="Utang usaha ke Afiliasi" s={o.afiliasi} />
      </div>
    </>
  );
}
