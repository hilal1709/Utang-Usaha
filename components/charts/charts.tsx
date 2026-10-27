"use client";

import { useSyncExternalStore } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import type { ChartOptions, TooltipItem } from "chart.js";
import { AGE_COLORS, C, fmtM } from "@/lib/charts/theme";
import { monthLabel } from "@/lib/format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpTooltip = (digits = 2): any => ({
  callbacks: { label: (ctx: TooltipItem<"bar">) => ` Rp ${fmtM(Number(ctx.raw), digits)} M` },
});

const NARROW = "(max-width: 639px)";
const subscribeNarrow = (fn: () => void) => {
  const mq = window.matchMedia(NARROW);
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
};

/** Layar HP (< 640px). Render server selalu "lebar" agar hidrasi cocok; grafik menyesuaikan setelah mount. */
function useNarrow() {
  return useSyncExternalStore(subscribeNarrow, () => window.matchMedia(NARROW).matches, () => false);
}

/** Tren bulanan (Des tahun lalu → periode). Bulan berjalan ditegaskan Cerulean, sisanya Cyan transparan. */
export function TrendChart({ points, height }: { points: { period: string; amount: number }[]; height?: number }) {
  const narrow = useNarrow();
  const last = points.length - 1;
  const options: ChartOptions<"bar"> = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: rpTooltip(2) },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { autoSkip: true, maxRotation: 0, font: { size: narrow ? 10 : 12 } } },
      y: { border: { display: false }, ticks: { callback: (v) => fmtM(Number(v)), maxTicksLimit: 5, font: { size: narrow ? 10 : 12 } }, title: { display: !narrow, text: "Milyar Rp" } },
    },
  };
  return (
    <div style={{ height: height ?? (narrow ? 220 : 260) }}>
      <Bar
        options={options}
        data={{
          labels: points.map((p) => monthLabel(p.period, true)),
          datasets: [{
            data: points.map((p) => p.amount),
            backgroundColor: points.map((p, i) => (i === last ? C.vanilla : p.amount ? C.bar : "rgba(255,255,255,0.08)")),
            hoverBackgroundColor: C.vanilla,
            borderRadius: 999,
            borderSkipped: false,
            maxBarThickness: 26,
          }],
        }}
      />
    </div>
  );
}

const STATUS_COLORS = [C.vanilla, C.sandy, "rgba(255,255,255,0.85)"];

/** Komposisi status tagihan: Clean & Clear / Proses Verifikasi / Belum Ditagihkan. */
export function StatusDonut({ status, height, center }: { status: { cleanClear: number; verifikasi: number; belumDitagihkan: number }; height?: number; center?: React.ReactNode }) {
  const narrow = useNarrow();
  const values = [status.cleanClear, status.verifikasi, status.belumDitagihkan];
  return (
    <div className="relative" style={{ height: height ?? (narrow ? 190 : 220) }}>
      <Doughnut
        options={{ maintainAspectRatio: false, cutout: "68%", plugins: { legend: { display: false }, tooltip: rpTooltip(2) } }}
        data={{
          labels: ["Clean & Clear", "Proses Verifikasi", "Belum Ditagihkan"],
          datasets: [{ data: values, backgroundColor: STATUS_COLORS, borderColor: "rgba(16, 52, 68, 0.55)", borderWidth: 3, borderRadius: 6, hoverOffset: 6, spacing: 2 }],
        }}
      />
      {center && <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">{center}</div>}
    </div>
  );
}

/**
 * Batang horizontal rata kiri dengan lebar batang seragam (aturan PPT).
 * Tiga nilai tertinggi diberi penekanan; sisanya Cyan lembut.
 * Di HP label dipendekkan agar batang tetap terbaca; nama lengkap tampil di tooltip.
 */
export function HBarChart({ rows, height, digits = 0, color = C.sandy }: { rows: { label: string; amount: number }[]; height?: number; digits?: number; color?: string }) {
  const narrow = useNarrow();
  const max = narrow ? 16 : 34;
  const h = height ?? Math.max(140, rows.length * (narrow ? 28 : 30) + 30);
  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { ...rpTooltip(2), callbacks: { ...rpTooltip(2).callbacks, title: (items: TooltipItem<"bar">[]) => rows[items[0]?.dataIndex ?? 0]?.label ?? "" } },
    },
    scales: {
      x: { border: { display: false }, ticks: { callback: (v) => fmtM(Number(v), digits), maxTicksLimit: narrow ? 4 : 5, font: { size: narrow ? 10 : 12 } } },
      y: { grid: { display: false }, border: { display: false }, ticks: { color: C.ink, font: { weight: 500, size: narrow ? 11 : 12 }, autoSkip: false } },
    },
  };
  return (
    <div style={{ height: h }}>
      <Bar
        options={options}
        data={{
          labels: rows.map((r) => (r.label.length > max ? r.label.slice(0, max - 1) + "…" : r.label)),
          datasets: [{
            data: rows.map((r) => r.amount),
            backgroundColor: rows.map((_, i) => (i === 0 ? C.vanilla : i === 1 ? color : i === 2 ? C.coral : C.barSoft)),
            borderRadius: 999,
            borderSkipped: false,
            barThickness: narrow ? 14 : 16,
          }],
        }}
      />
    </div>
  );
}

/** Jenis pembayaran (TT/SCF/SKBDN) sebagai batang vertikal ringkas. */
export function PaymentBars({ payment, height }: { payment: { TT: number; SCF: number; SKBDN: number }; height?: number }) {
  const narrow = useNarrow();
  const labels = ["TT", "SCF", "SKBDN"];
  const values = [payment.TT, payment.SCF, payment.SKBDN];
  return (
    <div style={{ height: height ?? (narrow ? 180 : 200) }}>
      <Bar
        options={{
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: rpTooltip(2) },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: C.ink, font: { weight: 600 } } },
            y: { border: { display: false }, ticks: { callback: (v) => fmtM(Number(v)), maxTicksLimit: 4 } },
          },
        }}
        data={{ labels, datasets: [{ data: values, backgroundColor: [C.vanilla, C.sandy, C.coral], borderRadius: 999, borderSkipped: false, maxBarThickness: 40 }] }}
      />
    </div>
  );
}

export { AGE_COLORS };
