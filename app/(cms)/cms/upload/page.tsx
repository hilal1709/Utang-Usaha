import type { Metadata } from "next";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { opcos, periods, submissions } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { isAdmin } from "@/lib/access";
import { PageHeader } from "@/components/shell/page-header";
import { UploadWorkspace } from "./upload-workspace";
import { SubmissionHistory } from "./submission-history";
import { endOfMonth } from "@/lib/rules/derive";

export const metadata: Metadata = { title: "Unggah laporan" };

/** Pilihan periode: 6 akhir bulan terakhir (default bulan lalu) + periode terbuka di DB. */
function periodOptions(dbPeriods: { period: string; status: string }[]) {
  const today = new Date().toISOString().slice(0, 10);
  const lastMonth = endOfMonth(today, -1);
  const set = new Map<string, string>();
  for (let i = -1; i < 6; i++) set.set(endOfMonth(lastMonth, -i), "open");
  for (const p of dbPeriods) set.set(p.period, p.status);
  return { options: [...set].sort((a, b) => b[0].localeCompare(a[0])).map(([period, status]) => ({ period, locked: status === "locked" })), defaultPeriod: lastMonth };
}

export default async function UploadPage({ searchParams }: PageProps<"/cms/upload">) {
  const user = await requireUser(["ADMIN", "OPCO"]);
  const sp = await searchParams;
  const [allOpcos, dbPeriods] = await Promise.all([
    db.select().from(opcos).where(eq(opcos.active, true)).orderBy(asc(opcos.sortOrder)),
    db.select().from(periods),
  ]);
  const opcoList = isAdmin(user.role) ? allOpcos : allOpcos.filter((o) => o.code === user.opcoCode);
  const selectedOpco = (typeof sp.opco === "string" && opcoList.some((o) => o.code === sp.opco) ? sp.opco : opcoList[0]?.code) ?? null;
  const { options, defaultPeriod } = periodOptions(dbPeriods);
  const history = selectedOpco
    ? await db.select().from(submissions).where(and(eq(submissions.opcoCode, selectedOpco))).orderBy(desc(submissions.createdAt)).limit(12)
    : [];

  return (
    <>
      <PageHeader
        title="Unggah laporan utang usaha"
        description="Gunakan Template Utang Usaha (sheet Detail). File diperiksa di perangkat Anda dulu, lalu dikirim per bagian."
        actions={<a href="/api/template" className="inline-flex h-9 items-center glass-pill rounded-full px-4 text-sm font-medium">Unduh template</a>}
      />
      <div className="grid gap-6 px-4 pb-14 sm:px-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {opcoList.length === 0 ? (
          <p className="text-sm text-ink-soft">Akun Anda belum terhubung ke OpCo. Hubungi admin Treasury.</p>
        ) : (
          <UploadWorkspace
            opcos={opcoList.map((o) => ({ code: o.code, name: o.name, cocds: o.cocds }))}
            fixedOpco={user.role === "OPCO"}
            initialOpco={selectedOpco!}
            periods={options}
            defaultPeriod={defaultPeriod}
          />
        )}
        <SubmissionHistory items={history.map((h) => ({
          id: h.id, period: h.period, version: h.version, status: h.status, fileName: h.fileName, rowCount: h.rowCount,
          totalAmount: h.totalAmount, errorCount: h.errorCount, warningCount: h.warningCount, createdAt: h.createdAt.toISOString(), source: h.source,
        }))} opcoCode={selectedOpco} />
      </div>
    </>
  );
}
