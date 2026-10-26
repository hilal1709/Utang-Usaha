"use client";

import { Bar, Doughnut } from "react-chartjs-2";
import type { ChartOptions, TooltipItem } from "chart.js";
import { AGE_COLORS, C, fmtM } from "@/lib/charts/theme";
import { monthLabel } from "@/lib/format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpTooltip = (digits = 2): any => ({
  callbacks: { label: (ctx: TooltipItem<"bar">) => ` Rp ${fmtM(Number(ctx.raw), digits)} M` },
});

/** Tren bulanan (Des tahun lalu → periode). Bulan berjalan ditegaskan Cerulean, sisanya Cyan transparan. */
export function TrendChart({ points, height = 260 }: { points: { period: string; amount: number }[]; height?: number }) {
  const last = points.length - 1;
  const options: ChartOptions<"bar"> = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: rpTooltip(2) },
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: { border: { display: false }, ticks: { callback: (v) => fmtM(Number(v)), maxTicksLimit: 5 }, title: { display: true, text: "Milyar Rp" } },
    },
  };
  return (
    <div style={{ height }}>
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
export function StatusDonut({ status, height = 220, center }: { status: { cleanClear: number; verifikasi: number; belumDitagihkan: number }; height?: number; center?: React.ReactNode }) {
  const values = [status.cleanClear, status.verifikasi, status.belumDitagihkan];
  return (
    <div className="relative" style={{ height }}>
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
 */
export function HBarChart({ rows, height, digits = 0, color = C.sandy }: { rows: { label: string; amount: number }[]; height?: number; digits?: number; color?: string }) {
  const h = height ?? Math.max(140, rows.length * 30 + 30);
  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: rpTooltip(2) },
    scales: {
      x: { border: { display: false }, ticks: { callback: (v) => fmtM(Number(v), digits), maxTicksLimit: 5 } },
      y: { grid: { display: false }, border: { display: false }, ticks: { color: C.ink, font: { weight: 500 }, autoSkip: false } },
    },
  };
  return (
    <div style={{ height: h }}>
      <Bar
        options={options}
        data={{
          labels: rows.map((r) => (r.label.length > 34 ? r.label.slice(0, 33) + "…" : r.label)),
          datasets: [{
            data: rows.map((r) => r.amount),
            backgroundColor: rows.map((_, i) => (i === 0 ? C.vanilla : i === 1 ? color : i === 2 ? C.coral : C.barSoft)),
            borderRadius: 999,
            borderSkipped: false,
            barThickness: 16,
          }],
        }}
      />
    </div>
  );
}

/** Jenis pembayaran (TT/SCF/SKBDN) sebagai batang vertikal ringkas. */
export function PaymentBars({ payment, height = 200 }: { payment: { TT: number; SCF: number; SKBDN: number }; height?: number }) {
  const labels = ["TT", "SCF", "SKBDN"];
  const values = [payment.TT, payment.SCF, payment.SKBDN];
  return (
    <div style={{ height }}>
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
