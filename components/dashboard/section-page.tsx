import Link from "next/link";
import { PageHeader, PeriodSelect } from "@/components/shell/page-header";
import { SectionView } from "@/components/dashboard/section-view";
import { ExportButton } from "@/components/dashboard/export-button";
import { Lottie } from "@/components/motion/lottie";
import { Banner } from "@/components/feedback/banner";
import { loadReport } from "@/lib/data/page-data";
import type { Report, Section } from "@/lib/data/report";
import { periodLabel, relTime } from "@/lib/format";

type Key = "konsolidasi" | "thirdParties" | "afiliasi" | "bumn" | "interco";

export async function SectionPage({ searchParams, sectionKey, title, subject, showCategory, children }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  sectionKey: Key; title: string; subject: string; showCategory?: boolean;
  children?: (report: Report, section: Section) => React.ReactNode;
}) {
  const { period, periods, report } = await loadReport(searchParams);
  if (!period || !report) return <NoData />;
  const section = report[sectionKey];
  return (
    <>
      <PageHeader
        title={title}
        description={<>Per {periodLabel(period)} · {report.scope ? `Data ${report.scope}` : `${report.submissionsCount} OpCo aktif`}{report.updatedAt ? ` · diperbarui ${relTime(report.updatedAt)}` : ""}</>}
        actions={<><PeriodSelect periods={periods} value={period} /><ExportButton period={period} /></>}
      />
      {section.total === 0 && (
        <div className="px-4 pb-4 sm:px-8"><Banner tone="info" title="Belum ada saldo pada kategori ini">Periode ini mungkin hanya berisi data tren historis, atau OpCo belum mengunggah.</Banner></div>
      )}
      <SectionView report={report} section={section} subject={subject} showCategory={showCategory} />
      {children?.(report, section)}
    </>
  );
}

export function NoData() {
  return (
    <div className="grid min-h-[70dvh] place-items-center px-6 text-center">
      <div className="max-w-md">
        <Lottie name="empty" className="mx-auto h-44 w-44" />
        <h1 className="mt-4 text-xl font-semibold text-ink">Belum ada laporan yang aktif</h1>
        <p className="mt-2 text-sm text-ink-soft">Dashboard terisi otomatis begitu OpCo mengunggah template dan lolos validasi.</p>
        <Link href="/cms/upload" className="mt-5 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/85">Buka halaman unggah</Link>
      </div>
    </div>
  );
}
