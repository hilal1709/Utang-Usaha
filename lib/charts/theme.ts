"use client";

import {
  ArcElement, BarElement, CategoryScale, Chart, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip,
} from "chart.js";

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip, Legend);

export const C = {
  cerulean: "#2d728f",
  cyan: "#3b8ea5",
  vanilla: "#f5ee9e",
  vanillaDeep: "#d9cf62",
  sandy: "#f49e4c",
  brick: "#ab3428",
  coral: "#ff8f80",
  ink: "#f6fbfd",
  inkSoft: "rgba(238, 247, 250, 0.78)",
  grid: "rgba(255, 255, 255, 0.12)",
  bar: "rgba(255, 255, 255, 0.58)",
  barSoft: "rgba(255, 255, 255, 0.34)",
};

export const AGE_COLORS = ["#3b8ea5", "#e9e08a", "#f4c06a", "#f49e4c", "#d0663a", "#ab3428"];

Chart.defaults.font.family = "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = C.inkSoft;
Chart.defaults.borderColor = C.grid;
// Ubah properti satu per satu: menimpa objek `animation` menghapus interpolator Chart.js ("this._fn is not a function").
const anim = Chart.defaults.animation as { duration: number; easing: string };
anim.duration = 600;
anim.easing = "easeOutExpo";
Chart.defaults.plugins.tooltip.backgroundColor = "rgba(12, 38, 50, 0.92)";
Chart.defaults.plugins.tooltip.borderColor = "rgba(255, 255, 255, 0.25)";
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.titleFont = { weight: 600 };
Chart.defaults.plugins.tooltip.boxPadding = 4;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyle = "rectRounded";
Chart.defaults.plugins.legend.labels.boxWidth = 10;
Chart.defaults.plugins.legend.labels.boxHeight = 10;

if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  anim.duration = 0;
}

export const fmtM = (v: number, digits = 0) => (v / 1e9).toLocaleString("id-ID", { maximumFractionDigits: digits, minimumFractionDigits: digits });
