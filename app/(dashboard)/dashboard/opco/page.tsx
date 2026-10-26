import type { Metadata } from "next";
import { PageHeader, PeriodSelect } from "@/components/shell/page-header";
import { NoData } from "@/components/dashboard/section-page";
import { ExportButton } from "@/components/dashboard/export-button";
import { OpcoCarousel, type OpcoCard } from "@/components/dashboard/opco-carousel";
import { Panel } from "@/components/dashboard/panel";
import { HBarChart } from "@/components/charts/charts";
import { loadReport } from "@/lib/data/page-data";
import { redirect } from "next/navigation";
import { periodLabel } from "@/lib/format";
import type { Bucket } from "@/lib/rules/constants";

export const metadata: Metadata = { title: "Per OpCo" };

export default async function Page({ searchParams }: PageProps<"/dashboard/opco">) {
  const { period, periods, report } = await loadReport(searchParams);
  if (!period || !report) return <NoData />;
  // Akun OpCo hanya punya satu entitas: langsung ke halaman detailnya.
  if (report.scope) redirect(`/dashboard/opco/${report.scope}?period=${period}`);
  const cards: OpcoCard[] = report.opcoOrder.map((code) => {
    const o = report.perOpco[code];
    const buckets = {} as Record<Bucket, number>;
    for (const s of [o.tp, o.bumn, o.afiliasi]) for (const [b, v] of Object.entries(s.buckets)) buckets[b as Bucket] = (buckets[b as Bucket] ?? 0) + v;
    return {
      code, name: report.opcoNames[code] ?? code, total: o.total, tp: o.tp.total, bumn: o.bumn.total, afiliasi: o.afiliasi.total, buckets,
      cleanClear: o.tp.status.cleanClear + o.bumn.status.cleanClear + o.afiliasi.status.cleanClear,
    };
  });
  return (
    <>
      <PageHeader title="Utang usaha per OpCo" description={<>Per {periodLabel(period)} · urutan mengikuti total di luar Interco (urutan slide PPT)</>}
        actions={<><PeriodSelect periods={periods} value={period} /><ExportButton period={period} /></>} />
      <div className="space-y-5 px-4 pb-14 sm:px-8">
        <OpcoCarousel cards={cards} period={period} />
        <Panel title="Peringkat entitas di luar Interco">
          <HBarChart rows={cards.map((c) => ({ label: c.code, amount: c.total }))} />
        </Panel>
      </div>
    </>
  );
}
