"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLive } from "@/components/realtime/live";
import { milyarAuto, monthLabel, relTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export type HistoryItem = {
  id: number; period: string; version: number; status: string; fileName: string | null; rowCount: number; totalAmount: number;
  errorCount: number; warningCount: number; createdAt: string; source: string;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Aktif", cls: "bg-[#b9d8c2] text-[#24402c]" },
  validating: { label: "Diproses", cls: "bg-[#9ac2c9]/60 text-[#1f3d44]" },
  rejected: { label: "Ditolak", cls: "bg-[#f5d3cf] text-[#8a2419]" },
  superseded: { label: "Diganti", cls: "bg-[#8aa1b1]/30 text-[#3b4a55]" },
};

/** Riwayat versi unggahan OpCo; ikut diperbarui saat ada event realtime untuk OpCo ini. */
export function SubmissionHistory({ items, opcoCode }: { items: HistoryItem[]; opcoCode: string | null }) {
  const router = useRouter();
  const { subscribe } = useLive();
  useEffect(() => subscribe((e) => { if (!opcoCode || e.opcoCode === opcoCode) router.refresh(); }), [subscribe, opcoCode, router]);
  return (
    <aside className="glass-solid h-fit rounded-2xl p-5" aria-label="Riwayat unggahan">
      <h2 className="font-semibold text-ink">Riwayat {opcoCode ?? ""}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">Belum ada unggahan. Versi pertama akan muncul di sini.</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {items.map((h) => {
            const st = STATUS[h.status] ?? STATUS.validating;
            return (
              <li key={h.id} className="rounded-xl bg-white/[0.08] p-3 ring-1 ring-white/15">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">{monthLabel(h.period)} · v{h.version}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[0.7rem] font-semibold", st.cls)}>{st.label}</span>
                </div>
                <p className="mt-1 truncate text-xs text-ink-soft" title={h.fileName ?? ""}>{h.source === "import" ? "Impor awal dari file Gabungan" : h.fileName}</p>
                <p className="num mt-1.5 text-xs text-ink">
                  {h.rowCount.toLocaleString("id-ID")} baris · Rp {milyarAuto(h.totalAmount)} M
                  {h.errorCount > 0 && <span className="text-[#ffb4a8]"> · {h.errorCount.toLocaleString("id-ID")} error</span>}
                </p>
                <p className="mt-0.5 text-[0.7rem] text-ink-soft">{relTime(h.createdAt)}</p>
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}
