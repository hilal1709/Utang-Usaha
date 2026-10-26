import type { Metadata } from "next";
import { SectionPage } from "@/components/dashboard/section-page";
import { Panel } from "@/components/dashboard/panel";
import { milyarAuto } from "@/lib/format";

export const metadata: Metadata = { title: "Interco" };

export default function Page({ searchParams }: PageProps<"/dashboard/interco">) {
  return (
    <SectionPage searchParams={searchParams} sectionKey="interco" title="Utang usaha Interco SIG" subject="Utang Usaha Interco SIG">
      {(report) => {
        const rows = report.intercoOver365;
        const max = Math.max(1, ...rows.map((r) => r.amount));
        return (
          <div className="px-4 pb-14 sm:px-8">
            <Panel title="Analisa utang Interco berumur > 365 hari" id="over365">
              {rows.length === 0 ? (
                <p className="text-sm text-ink-soft">Tidak ada utang Interco berumur lebih dari 365 hari pada periode ini.</p>
              ) : (
                <>
                  <ul className="divide-y divide-border">
                    {rows.map((r) => (
                      <li key={r.code} className="grid gap-3 py-4 md:grid-cols-[16rem_1fr]">
                        <div>
                          <p className="text-sm font-semibold text-ink">{report.opcoNames[r.code] ?? r.code} <span className="font-medium text-ink-soft">({r.code})</span></p>
                          <p className="num mt-1 text-[1.35rem] font-semibold tracking-[-0.02em] text-[#ffc2b8]">Rp {milyarAuto(r.amount)} M</p>
                          <div className="mt-2 h-1.5 rounded-full bg-white/15"><div className="h-full rounded-full bg-[#ff8f80]" style={{ width: `${(r.amount / max) * 100}%` }} /></div>
                        </div>
                        <ul className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                          {r.vendors.map((v) => (
                            <li key={v.name} className="flex items-baseline justify-between gap-3 border-b border-dashed border-border pb-1">
                              <span className="truncate text-ink" title={v.name}>{v.name}</span>
                              <span className="num shrink-0 font-medium text-ink">{milyarAuto(v.amount)}</span>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm text-ink">
                    Untuk utang usaha berumur lama perlu dilakukan inisiasi penyelesaian, baik melalui skema <em>net off</em>, <em>sweeping</em>, maupun <em>fund flow</em>.
                  </p>
                </>
              )}
            </Panel>
          </div>
        );
      }}
    </SectionPage>
  );
}
