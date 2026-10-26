import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { opcoScope } from "@/lib/access";
import { PageHeader, PeriodSelect } from "@/components/shell/page-header";
import { ExportButton } from "@/components/dashboard/export-button";
import { Banner } from "@/components/feedback/banner";
import { resolvePeriod } from "@/lib/data/page-data";
import { buildReport, uploadMatrix } from "@/lib/data/report";
import { monthLabel, periodLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Ekspor" };

export default async function ExportPage({ searchParams }: PageProps<"/cms/export">) {
  const opco = opcoScope(await requireUser());
  const { period, periods } = await resolvePeriod(searchParams, opco);
  if (!period) return <PageHeader title="Ekspor laporan" description="Belum ada periode berdata." />;
  const [report, matrix] = await Promise.all([buildReport(period, { opco }), uploadMatrix(period, { opco })]);
  const missing = matrix.filter((m) => !m.active).length;
  return (
    <>
      <PageHeader title="Ekspor laporan" description={`Periode ${periodLabel(period)}${opco ? ` · hanya data ${opco}` : ""}`} actions={<PeriodSelect periods={periods} value={period} />} />
      <div className="grid gap-5 px-4 pb-14 sm:px-8 lg:grid-cols-2">
        {missing > 0 && (
          <Banner className="lg:col-span-2" tone="warning" title={opco ? `Laporan ${opco} untuk ${monthLabel(period)} belum aktif` : `${missing} OpCo belum aktif untuk ${monthLabel(period)}`}>
            {opco ? "Unggah template di halaman Unggah laporan agar ekspor berisi data." : "Ekspor tetap bisa dilakukan, tetapi angka konsolidasi belum lengkap. Cek halaman Monitoring."}
          </Banner>
        )}
        <section className="glass-solid flex flex-col rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-ink">Presentasi pimpinan (.pptx)</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Struktur sama dengan “Laporan Aging Utang Usaha Group AP Management”: cover, daftar isi, Konsolidasi, Pihak Ketiga, Afiliasi, BUMN,
            {" "}{report.opcoOrder.length} slide OpCo (urut total di luar Interco), Interco, dan analisa Interco &gt; 365 hari. Grafik native — bisa diedit di PowerPoint.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-ink">
            <li>Batang tertinggi abu tua, kedua abu muda, ketiga merah</li>
            <li>Nilai Milyar Rupiah; slide 3–6 tanpa desimal</li>
            <li>Kesimpulan naik/turun dihitung otomatis</li>
          </ul>
          <div className="mt-auto pt-6"><ExportButton period={period} kind="ppt" label="Unduh PPT" /></div>
        </section>
        <section className="glass-solid flex flex-col rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-ink">Utang Usaha Gabungan (.xlsx)</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Sheet <b>Source</b> berisi seluruh baris aktif {opco ? `OpCo ${opco}` : "semua OpCo"} dengan kolom yang sama seperti file Gabungan (Range TOP, Masalah Dashboard, Jatuh Tempo2, bucket umur), ditambah sheet <b>Tren</b>.
          </p>
          <p className="mt-3 text-sm text-ink">{report.submissionsCount} OpCo aktif · siap dipakai untuk pivot.</p>
          <div className="mt-auto pt-6"><ExportButton period={period} kind="xlsx" variant="outline" label="Unduh Excel Gabungan" /></div>
        </section>
      </div>
    </>
  );
}
