"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { animate, stagger } from "animejs";
import { Check, CircleAlert, FileSpreadsheet, Download, RotateCcw, Send, TriangleAlert, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Banner } from "@/components/feedback/banner";
import { toast } from "@/components/feedback/toaster";
import { Lottie } from "@/components/motion/lottie";
import { StrataBar } from "@/components/charts/strata";
import type { IssueGroup } from "@/lib/validation";
import type { Bucket } from "@/lib/rules/constants";
import { milyarAuto, monthLabel, periodLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { buildCorrectionWorkbook } from "./correction-file";
import { ThemedSelect } from "@/components/ui/themed-select";

type Opco = { code: string; name: string; cocds: string[] };
type Summary = {
  issues: IssueGroup[]; errorCount: number; warningCount: number; totalRows: number; validRows: number; totalAmount: number;
  map: Record<string, number> | null; flipSign: boolean; byBucket: Record<string, number>;
};
type Phase =
  | { k: "idle" }
  | { k: "parsing"; step: "read" | "validate"; file: File }
  | { k: "fatal"; file: File; message: string }
  | { k: "review"; file: File; summary: Summary }
  | { k: "sending"; file: File; summary: Summary; sent: number }
  | { k: "done"; file: File; summary: Summary; status: "active" | "rejected"; submissionId: number };

const BATCH = 3000;

/** Kelompok pemeriksaan yang ditampilkan sebagai checklist; kode masalah dipetakan ke kelompoknya. */
const CHECKS: { label: string; codes: string[] }[] = [
  { label: "Sheet Detail & header template", codes: ["NO_DETAIL_SHEET", "HEADER_NOT_FOUND", "MISSING_COLUMN", "HEADER_SHIFTED", "EMPTY_FILE"] },
  { label: "Periode laporan", codes: ["PERIOD_MISMATCH"] },
  { label: "CoCd milik OpCo", codes: ["COCD_EMPTY", "COCD_NOT_ALLOWED"] },
  { label: "Tanggal posting, dokumen & jatuh tempo", codes: ["POSTING_INVALID", "DOCDATE_INVALID", "DUE_INVALID", "DUE_FILLED"] },
  { label: "Amount & TOP berupa angka", codes: ["AMOUNT_INVALID", "AMOUNT_ZERO", "AMOUNT_SIGN", "TOP_INVALID", "TOP_TEXT"] },
  { label: "Kategori vendor, transaksi & pembayaran", codes: ["KV_INVALID", "KT_INVALID", "KT_FIXED", "JT_INVALID", "JP_INVALID", "VALUE_STD", "VENDOR_MASTER_KATEGORI"] },
  { label: "Posisi & status dokumen", codes: ["POSISI_INVALID"] },
  { label: "Nama vendor terstandar", codes: ["VENDOR_EMPTY", "VENDOR_STD", "DOC_EMPTY"] },
  { label: "Kolom umur (R–W) sesuai Amount", codes: ["BUCKET_SUM", "BUCKET_DIFF"] },
  { label: "Tidak ada baris duplikat", codes: ["DUPLICATE"] },
];

let vendorCache: Promise<[string, string, string | null][]> | null = null;

export function UploadWorkspace({ opcos, fixedOpco, initialOpco, periods, defaultPeriod }: {
  opcos: Opco[]; fixedOpco: boolean; initialOpco: string; periods: { period: string; locked: boolean }[]; defaultPeriod: string;
}) {
  const router = useRouter();
  const [opco, setOpco] = useState(initialOpco);
  const [period, setPeriod] = useState(defaultPeriod);
  const [phase, setPhase] = useState<Phase>({ k: "idle" });
  const [drag, setDrag] = useState(false);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const accepted = useRef<{ r: number; c: unknown[] }[]>([]);
  const buffer = useRef<ArrayBuffer | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const checklistRef = useRef<HTMLUListElement>(null);
  const selected = opcos.find((o) => o.code === opco)!;
  const locked = periods.find((p) => p.period === period)?.locked ?? false;

  const reset = () => { accepted.current = []; buffer.current = null; setPhase({ k: "idle" }); };

  const handleFile = async (file: File) => {
    if (!/\.xlsx$/i.test(file.name)) {
      toast.error("Format file tidak didukung", { description: "Simpan sebagai Excel Workbook (.xlsx) dari template resmi." });
      return;
    }
    setPhase({ k: "parsing", step: "read", file });
    vendorCache ??= fetch("/api/master/vendors").then((r) => r.json());
    const [buf, vendors] = await Promise.all([file.arrayBuffer(), vendorCache]);
    buffer.current = buf.slice(0);
    const worker = new Worker(new URL("../../../../workers/parse-excel.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e) => {
      const m = e.data;
      if (m.type === "progress") setPhase({ k: "parsing", step: m.step, file });
      if (m.type === "fatal") { setPhase({ k: "fatal", file, message: m.message }); worker.terminate(); }
      if (m.type === "done") { accepted.current = m.accepted; setAcceptedCount(m.accepted.length); setPhase({ k: "review", file, summary: m.summary }); worker.terminate(); }
    };
    worker.onerror = (err) => { setPhase({ k: "fatal", file, message: err.message || "Gagal membaca file." }); worker.terminate(); };
    worker.postMessage({ buffer: buf, period, allowedCocds: selected.cocds, vendors }, [buf]);
  };

  useEffect(() => {
    if (phase.k !== "review" || !checklistRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    animate(checklistRef.current.querySelectorAll("li"), { opacity: [0, 1], translateX: [-8, 0], delay: stagger(55), duration: 420, ease: "outExpo" });
  }, [phase.k]);

  const send = async () => {
    if (phase.k !== "review") return;
    const { file, summary } = phase;
    setPhase({ k: "sending", file, summary, sent: 0 });
    try {
      const start = await post("/api/upload/start", {
        period, opcoCode: opco, fileName: file.name, expectedRows: summary.validRows, flipSign: summary.flipSign, columnMap: summary.map ?? {},
      });
      const rows = accepted.current;
      for (let i = 0; i < rows.length; i += BATCH) {
        await post(`/api/upload/${start.id}/rows`, { rows: rows.slice(i, i + BATCH) });
        setPhase({ k: "sending", file, summary, sent: Math.min(rows.length, i + BATCH) });
      }
      const fileIssues = summary.issues.filter((g) => ["HEADER_SHIFTED", "AMOUNT_SIGN", "PERIOD_MISMATCH"].includes(g.code));
      const res = await post(`/api/upload/${start.id}/finalize`, { fileIssues });
      setPhase({ k: "done", file, summary, status: res.status, submissionId: start.id });
      if (res.status === "active") toast.success(`Data ${opco} ${monthLabel(period)} aktif`, { description: "Dashboard semua pengguna sudah diperbarui." });
      else toast.error("Unggahan ditolak server", { description: `${res.errorCount} masalah ditemukan saat validasi ulang.` });
      router.refresh();
    } catch (e) {
      toast.error("Pengiriman gagal", { description: (e as Error).message });
      setPhase({ k: "review", file, summary });
    }
  };

  const downloadCorrection = async () => {
    if (!buffer.current || (phase.k !== "review" && phase.k !== "done")) return;
    const blob = await buildCorrectionWorkbook(buffer.current, phase.summary.issues);
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: phase.file.name.replace(/\.xlsx$/i, "") + " - perbaikan.xlsx" });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  return (
    <div className="min-w-0 space-y-5">
      <div className="glass-solid grid gap-4 rounded-2xl p-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink">OpCo</span>
          <ThemedSelect value={opco} disabled={fixedOpco || phase.k !== "idle"} onChange={(v) => { setOpco(v); router.replace(`/cms/upload?opco=${v}`); }}
            className="mt-1.5 h-10 w-full" options={opcos.map((o) => ({ value: o.code, label: `${o.code} — ${o.name}` }))} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Periode laporan</span>
          <ThemedSelect value={period} disabled={phase.k !== "idle"} onChange={setPeriod}
            className="mt-1.5 h-10 w-full" options={periods.map((p) => ({ value: p.period, label: `${periodLabel(p.period)}${p.locked ? " — dikunci" : ""}` }))} />
        </label>
        {selected.cocds.length > 0 && <p className="text-xs text-ink-soft sm:col-span-2">CoCd terdaftar untuk {selected.code}: {selected.cocds.join(", ")}</p>}
      </div>

      {locked && <Banner tone="locked" title="Periode ini sudah dikunci">Treasury telah menutup {monthLabel(period)}. Pilih periode lain atau minta admin membuka kembali.</Banner>}

      {phase.k === "idle" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f && !locked) handleFile(f); }}
          className={cn(
            "glass relative grid min-h-[280px] place-items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-[border-color,background-color] duration-200",
            drag ? "border-[#ffcb47] bg-white/20" : "border-white/35",
            locked && "pointer-events-none opacity-60",
          )}
        >
          <div className="max-w-md">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#b9d8c2] text-[#2f3a2c]"><UploadCloud className="size-7" /></span>
            <p className="mt-4 text-lg font-semibold text-ink">Tarik file template ke sini</p>
            <p className="mt-1.5 text-sm text-ink-soft">
              Laporan {selected.code} periode {periodLabel(period)}. Satu file .xlsx berisi sheet <b>Detail</b>, header di baris 10, data mulai baris 13.
            </p>
            <Button className="mt-5 h-10 bg-[var(--action)] px-4 text-[var(--action-ink)] hover:bg-[#f5bd2c]" onClick={() => inputRef.current?.click()} disabled={locked}>
              <FileSpreadsheet /> Pilih file
            </Button>
            <input ref={inputRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handleFile(f); }} />
          </div>
        </div>
      )}

      {phase.k === "parsing" && (
        <div className="glass-solid grid min-h-[280px] place-items-center rounded-2xl p-8 text-center" aria-live="polite">
          <div>
            <Lottie name="loader" className="mx-auto h-28 w-32" />
            <p className="mt-3 font-semibold text-ink">{phase.step === "read" ? "Membaca file…" : "Memeriksa setiap baris…"}</p>
            <p className="mt-1 text-sm text-ink-soft">{phase.file.name} · {(phase.file.size / 1024 / 1024).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB. File besar bisa butuh beberapa puluh detik.</p>
          </div>
        </div>
      )}

      {phase.k === "fatal" && (
        <div className="glass-solid rounded-2xl p-6 text-center">
          <Lottie name="upload-error" className="mx-auto h-32 w-32" loop={false} />
          <p className="mt-2 text-lg font-semibold text-ink">File tidak bisa diproses</p>
          <p className="mx-auto mt-1.5 max-w-lg text-sm text-ink-soft">{phase.message}</p>
          <Button variant="outline" className="mt-5" onClick={reset}><RotateCcw /> Pilih file lain</Button>
        </div>
      )}

      {(phase.k === "review" || phase.k === "sending" || phase.k === "done") && (
        <ReviewPanel
          phase={phase} period={period} opco={selected} checklistRef={checklistRef}
          onSend={send} onReset={reset} onDownload={downloadCorrection} locked={locked} totalAccepted={acceptedCount}
        />
      )}
    </div>
  );
}

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Server menolak permintaan (${res.status}).`);
  return data;
}

function ReviewPanel({ phase, period, opco, checklistRef, onSend, onReset, onDownload, locked, totalAccepted }: {
  phase: Extract<Phase, { k: "review" | "sending" | "done" }>; period: string; opco: Opco; checklistRef: React.RefObject<HTMLUListElement | null>;
  onSend: () => void; onReset: () => void; onDownload: () => void; locked: boolean; totalAccepted: number;
}) {
  const s = phase.summary;
  const blocked = s.errorCount > 0;
  const status = (codes: string[]) => {
    const groups = s.issues.filter((g) => codes.includes(g.code));
    if (groups.some((g) => g.severity === "error")) return { tone: "error" as const, n: groups.filter((g) => g.severity === "error").reduce((a, g) => a + g.count, 0) };
    if (groups.length) return { tone: "warning" as const, n: groups.reduce((a, g) => a + g.count, 0) };
    return { tone: "ok" as const, n: 0 };
  };
  const pct = phase.k === "sending" ? Math.round((phase.sent / Math.max(1, totalAccepted)) * 100) : 0;
  const buckets = s.byBucket as Record<Bucket, number>;

  return (
    <div className="space-y-5">
      {phase.k === "done" ? (
        <div className="glass-solid flex flex-wrap items-center gap-5 rounded-2xl p-5">
          <Lottie name={phase.status === "active" ? "upload-success" : "upload-error"} className="size-24 shrink-0" loop={false} />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-ink">{phase.status === "active" ? "Laporan diterima dan aktif" : "Laporan ditolak saat validasi ulang"}</p>
            <p className="mt-1 text-sm text-ink-soft">
              {phase.status === "active"
                ? `${s.validRows.toLocaleString("id-ID")} baris ${opco.code} ${monthLabel(period)} menggantikan versi sebelumnya. Dashboard sudah diperbarui.`
                : "Lihat riwayat unggahan untuk rincian, perbaiki file, lalu unggah ulang."}
            </p>
          </div>
          <Button variant="outline" onClick={onReset}><RotateCcw /> Unggah file lain</Button>
        </div>
      ) : blocked ? (
        <Banner tone="danger" title={`${s.errorCount.toLocaleString("id-ID")} kesalahan harus diperbaiki sebelum dikirim`}
          action={<Button size="sm" variant="outline" onClick={onDownload}><Download /> Unduh file perbaikan</Button>}>
          File perbaikan berisi file Anda dengan sel bermasalah ditandai merah, ditambah sheet daftar kesalahan dan saran perbaikannya.
        </Banner>
      ) : (
        <Banner tone="info" title="File lolos pemeriksaan"
          action={s.warningCount ? <Button size="sm" variant="outline" onClick={onDownload}><Download /> Unduh catatan</Button> : undefined}>
          {s.warningCount ? `${s.warningCount.toLocaleString("id-ID")} penulisan dirapikan otomatis — periksa daftar di bawah.` : "Tidak ada yang perlu dirapikan."}
        </Banner>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="glass-solid rounded-2xl p-5" aria-label="Hasil pemeriksaan">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-semibold text-ink">Pemeriksaan</h2>
            <span className="truncate text-xs text-ink-soft" title={phase.file.name}>{phase.file.name}</span>
          </div>
          <ul ref={checklistRef} className="mt-3 space-y-1.5">
            {CHECKS.map((c) => {
              const st = status(c.codes);
              return (
                <li key={c.label} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm">
                  <span className={cn("grid size-6 shrink-0 place-items-center rounded-full",
                    st.tone === "ok" && "bg-[#b9d8c2] text-[#24402c]", st.tone === "warning" && "bg-[#ffe4a3] text-[#6b4a00]", st.tone === "error" && "bg-[#f5d3cf] text-[#8a2419]")}>
                    {st.tone === "ok" ? <Check className="size-3.5" /> : st.tone === "warning" ? <TriangleAlert className="size-3.5" /> : <X className="size-3.5" />}
                  </span>
                  <span className="flex-1 text-ink">{c.label}</span>
                  {st.n > 0 && <span className="num text-xs font-medium text-ink-soft">{st.n.toLocaleString("id-ID")}</span>}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="glass-solid rounded-2xl p-5" aria-label="Ringkasan isi file">
          <h2 className="font-semibold text-ink">Isi file</h2>
          <dl className="mt-3 grid grid-cols-3 gap-3">
            <div><dt className="text-xs text-ink-soft">Baris data</dt><dd className="num text-xl font-semibold text-ink">{s.totalRows.toLocaleString("id-ID")}</dd></div>
            <div><dt className="text-xs text-ink-soft">Lolos</dt><dd className="num text-xl font-semibold text-ink">{s.validRows.toLocaleString("id-ID")}</dd></div>
            <div><dt className="text-xs text-ink-soft">Total (M)</dt><dd className="num text-xl font-semibold text-ink">{milyarAuto(s.totalAmount)}</dd></div>
          </dl>
          <p className="mt-4 mb-2 text-xs font-medium text-ink-soft">Umur utang dari baris yang lolos</p>
          <StrataBar buckets={buckets} height={16} />
          {phase.k === "sending" && (
            <div className="mt-5" aria-live="polite">
              <div className="mb-1.5 flex justify-between text-xs text-ink-soft"><span>Mengirim ke server…</span><span className="num">{pct}%</span></div>
              <Progress value={pct} />
            </div>
          )}
          {phase.k === "review" && (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={onSend} disabled={blocked || locked} className="h-10 bg-[var(--action)] px-4 text-[var(--action-ink)] hover:bg-[#f5bd2c]">
                <Send /> Kirim ke Treasury
              </Button>
              <Button variant="outline" className="h-10" onClick={onReset}><RotateCcw /> Ganti file</Button>
            </div>
          )}
        </section>
      </div>

      {s.issues.length > 0 && <IssueList groups={s.issues} />}
    </div>
  );
}

function IssueList({ groups }: { groups: IssueGroup[] }) {
  const [open, setOpen] = useState<string | null>(groups.find((g) => g.severity === "error")?.code ?? null);
  const sorted = useMemo(() => groups, [groups]);
  return (
    <section className="glass-solid rounded-2xl" aria-label="Daftar masalah">
      <h2 className="px-5 pt-4 font-semibold text-ink">Rincian per jenis masalah</h2>
      <ul className="mt-2 divide-y divide-border">
        {sorted.map((g) => {
          const isOpen = open === g.code;
          return (
            <li key={g.code}>
              <button onClick={() => setOpen(isOpen ? null : g.code)} aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm hover:bg-white/[0.07]">
                {g.severity === "error" ? <CircleAlert className="size-4 shrink-0 text-[#ff9b8d]" /> : <TriangleAlert className="size-4 shrink-0 text-[#c27a12]" />}
                <span className="flex-1 font-medium text-ink">{g.title}</span>
                <span className={cn("num rounded-full px-2 py-0.5 text-xs font-semibold", g.severity === "error" ? "bg-[#f5d3cf] text-[#8a2419]" : "bg-[#ffe9b0] text-[#6b4a00]")}>
                  {g.count.toLocaleString("id-ID")}
                </span>
              </button>
              {isOpen && (
                <div className="overflow-x-auto px-5 pb-4 scroll-thin">
                  <table className="w-full min-w-[640px] text-left text-[0.82rem]">
                    <thead className="text-xs text-ink-soft">
                      <tr><th className="py-2 pr-3 font-medium">Baris</th><th className="py-2 pr-3 font-medium">Kolom</th><th className="py-2 pr-3 font-medium">Nilai di file</th><th className="py-2 pr-3 font-medium">Masalah</th><th className="py-2 font-medium">Perbaikan</th></tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                      {g.samples.slice(0, 100).map((i, idx) => (
                        <tr key={idx} className="align-top">
                          <td className="num py-2 pr-3 font-medium text-ink">{i.row ?? "–"}</td>
                          <td className="py-2 pr-3 text-ink">{i.column ?? "–"}</td>
                          <td className="max-w-[12rem] truncate py-2 pr-3 text-ink-soft" title={i.value}>{i.value || "(kosong)"}</td>
                          <td className="py-2 pr-3 text-ink">{i.message}</td>
                          <td className="py-2 text-ink-soft">{i.suggestion ?? "–"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {g.count > Math.min(100, g.samples.length) && (
                    <p className="pt-2 text-xs text-ink-soft">Menampilkan {Math.min(100, g.samples.length)} dari {g.count.toLocaleString("id-ID")}. Daftar lengkap ada di file perbaikan.</p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
