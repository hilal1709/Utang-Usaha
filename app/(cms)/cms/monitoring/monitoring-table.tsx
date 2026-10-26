"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { useLive } from "@/components/realtime/live";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { milyarAuto, relTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Row = {
  code: string; name: string;
  latest: { id: number; status: string; version: number; fileName: string | null; rowCount: number; errorCount: number; warningCount: number; createdAt: string; source: string } | null;
  activeTotal: number | null; activeVersion: number | null;
};

const BADGE: Record<string, [string, string]> = {
  active: ["Aktif", "bg-[#b9d8c2] text-[#24402c]"],
  validating: ["Sedang diunggah", "bg-[#ffe4a3] text-[#6b4a00]"],
  rejected: ["Ditolak", "bg-[#f5d3cf] text-[#8a2419]"],
  superseded: ["Diganti", "bg-[#8aa1b1]/30 text-[#3b4a55]"],
  none: ["Belum unggah", "bg-white/15 text-ink"],
};

type Issue = { id: number; row: number | null; column: string | null; code: string; message: string; severity: string; value: string | null; suggestion: string | null };

/** Matriks status OpCo; diperbarui otomatis setiap ada event unggah (SSE). */
export function MonitoringTable({ period, rows }: { period: string; rows: Row[] }) {
  const router = useRouter();
  const { subscribe } = useLive();
  const [detail, setDetail] = useState<{ code: string; issues: Issue[] | null } | null>(null);
  useEffect(() => subscribe((e) => { if (!e.period || e.period === period) router.refresh(); }), [subscribe, router, period]);

  const openIssues = async (code: string, id: number) => {
    setDetail({ code, issues: null });
    const res = await fetch(`/api/upload/${id}/issues`).then((r) => r.json());
    setDetail({ code, issues: res.issues ?? [] });
  };

  return (
    <div className="glass-solid overflow-x-auto rounded-2xl scroll-thin">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="text-xs text-ink-soft">
          <tr className="border-b border-border">
            <th className="px-5 py-3 font-medium">OpCo</th>
            <th className="px-3 py-3 font-medium">Status unggahan terakhir</th>
            <th className="px-3 py-3 text-right font-medium">Baris</th>
            <th className="px-3 py-3 text-right font-medium">Total aktif (M)</th>
            <th className="px-3 py-3 font-medium">Masalah</th>
            <th className="px-5 py-3 font-medium">Waktu</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => {
            const [label, cls] = BADGE[r.latest?.status ?? "none"];
            return (
              <tr key={r.code} className="hover:bg-white/[0.07]">
                <td className="px-5 py-3">
                  <p className="font-semibold text-ink">{r.code}</p>
                  <p className="text-xs text-ink-soft">{r.name}</p>
                </td>
                <td className="px-3 py-3">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", cls)}>{label}</span>
                  {r.latest && <span className="ml-2 text-xs text-ink-soft">v{r.latest.version}{r.activeVersion && r.activeVersion !== r.latest.version ? ` · aktif v${r.activeVersion}` : ""}</span>}
                </td>
                <td className="num px-3 py-3 text-right text-ink">{r.latest ? r.latest.rowCount.toLocaleString("id-ID") : "–"}</td>
                <td className="num px-3 py-3 text-right font-medium text-ink">{r.activeTotal != null ? milyarAuto(r.activeTotal) : "–"}</td>
                <td className="px-3 py-3">
                  {r.latest && (r.latest.errorCount || r.latest.warningCount) ? (
                    <button onClick={() => openIssues(r.code, r.latest!.id)} className="inline-flex items-center gap-1.5 text-xs font-medium text-ink underline-offset-2 hover:underline">
                      {r.latest.errorCount > 0 && <CircleAlert className="size-3.5 text-[#ff9b8d]" />}
                      {r.latest.errorCount.toLocaleString("id-ID")} error · {r.latest.warningCount.toLocaleString("id-ID")} dirapikan
                    </button>
                  ) : <span className="text-xs text-ink-soft">–</span>}
                </td>
                <td className="px-5 py-3 text-xs text-ink-soft">
                  {r.latest ? relTime(r.latest.createdAt) : <Link href={`/cms/upload?opco=${r.code}`} className="font-medium text-ink hover:underline">Unggah atas nama OpCo</Link>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Masalah unggahan {detail?.code}</DialogTitle>
            <DialogDescription>Contoh baris per jenis masalah dari validasi server.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto scroll-thin">
            {!detail?.issues ? <p className="py-8 text-center text-sm text-ink-soft">Memuat…</p> : detail.issues.length === 0 ? <p className="py-8 text-center text-sm text-ink-soft">Tidak ada catatan.</p> : (
              <table className="w-full text-left text-[0.8rem]">
                <thead className="sticky top-0 bg-[var(--glass-strong)] text-xs text-ink-soft"><tr><th className="py-2 pr-2">Baris</th><th className="py-2 pr-2">Kolom</th><th className="py-2 pr-2">Masalah</th><th className="py-2">Saran</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {detail.issues.slice(0, 300).map((i) => (
                    <tr key={i.id} className="align-top">
                      <td className="num py-1.5 pr-2">{i.row ?? "–"}</td>
                      <td className="py-1.5 pr-2">{i.column ?? "–"}</td>
                      <td className={cn("py-1.5 pr-2", i.severity === "error" ? "text-[#ffb4a8]" : "text-ink")}>{i.message}</td>
                      <td className="py-1.5 text-ink-soft">{i.suggestion ?? "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
