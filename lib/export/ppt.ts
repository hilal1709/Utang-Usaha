import { readFile } from "node:fs/promises";
import path from "node:path";
import PptxGenJS from "pptxgenjs";
import type { Report, Section } from "@/lib/data/report";
import { kesimpulan } from "@/lib/narrative";
import { monthLabel, periodLabel } from "@/lib/format";

/*
 * Laporan Aging Utang Usaha Group AP Management — struktur mengikuti PPT Agustus 2026:
 * cover, daftar isi, 1 Konsolidasi, 2 Pihak Ketiga, 3 Afiliasi, 4 BUMN, slide per OpCo
 * (urut total di luar Interco), 5 Interco, 6 Analisa Interco > 365 hari.
 * Aturan "Catatan Penyusunan": batang tertinggi abu tua, kedua abu muda, ketiga merah;
 * slide 3–6 tanpa desimal; batang rata kiri dengan lebar seragam.
 */

const W = 13.333;
const FONT = "Calibri";
const INK = "1F1F1F";
const MUTED = "595959";
const DARK_GREY = "404040";
const LIGHT_GREY = "A6A6A6";
const RED = "C00000";
const REST = "D0D0D0";
const STATUS = { clean: "92D050", verif: "FFFF00", belum: "FF0000" };

const toM = (n: number) => n / 1e9;
const rp = (n: number, digits = 0) => {
  const v = toM(n);
  if (Math.abs(v) < 0.0005) return "Rp.-";
  return "Rp." + v.toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits });
};
const smart = (n: number) => {
  const v = Math.abs(toM(n));
  return rp(n, v === 0 ? 0 : v >= 100 ? 0 : v >= 1 ? 2 : v >= 0.01 ? 2 : 3);
};

/** Warna per batang sesuai peringkat nilai (bukan urutan tampil). */
function rankColors(values: number[]) {
  const order = values.map((v, i) => [v, i] as const).sort((a, b) => b[0] - a[0]).map(([, i]) => i);
  const colors = values.map(() => REST);
  if (order[0] != null) colors[order[0]] = DARK_GREY;
  if (order[1] != null) colors[order[1]] = LIGHT_GREY;
  if (order[2] != null) colors[order[2]] = RED;
  return colors;
}

type Box = { x: number; y: number; w: number; h: number };

function panelTitle(s: PptxGenJS.Slide, text: string, b: Box) {
  s.addText([{ text, options: { bold: true } }, { text: " (Dalam Milyaran Rupiah)", options: { italic: true, color: MUTED } }], {
    x: b.x, y: b.y, w: b.w, h: 0.3, fontFace: FONT, fontSize: 10.5, color: INK, margin: 0,
  });
  s.addShape("line", { x: b.x, y: b.y + 0.32, w: b.w, h: 0, line: { color: "BFBFBF", width: 0.75 } });
}

function slideTitle(s: PptxGenJS.Slide, text: string) {
  s.addText(text, { x: 0.45, y: 0.62, w: W - 0.9, h: 0.5, fontFace: FONT, fontSize: 20, bold: true, color: INK, margin: 0 });
}

/** Panah status (hijau/kuning/merah) seperti PPT acuan, dengan nilai di bawahnya. */
function statusChevrons(s: PptxGenJS.Slide, sec: Section, b: Box, digits: number) {
  const items = [
    { label: "Clean & Clear\n(Menunggu TOP Pembayaran)", v: sec.status.cleanClear, color: STATUS.clean, ink: "1F3A0F" },
    { label: "Proses Verifikasi\nTagihan", v: sec.status.verifikasi, color: STATUS.verif, ink: "3A3500" },
    { label: "Belum\nditagihkan", v: sec.status.belumDitagihkan, color: STATUS.belum, ink: "FFFFFF" },
  ];
  const totalH = 0.42;
  s.addText(`Total ${rp(sec.total, digits)}`, {
    x: b.x, y: b.y, w: b.w, h: totalH, fontFace: FONT, fontSize: 15, bold: true, color: "FFFFFF", align: "center",
    fill: { color: "2D728F" }, rectRadius: 0.06, shape: "roundRect",
  });
  const gap = 0.08;
  const cw = (b.w - gap * 2) / 3;
  items.forEach((it, i) => {
    const x = b.x + i * (cw + gap);
    s.addText(it.label, {
      shape: "chevron", x, y: b.y + totalH + 0.15, w: cw, h: 1.0, fill: { color: it.color }, line: { color: it.color },
      fontFace: FONT, fontSize: 9, bold: true, color: it.ink, align: "center", valign: "middle",
    });
    s.addText(rp(it.v, digits), { x, y: b.y + totalH + 1.2, w: cw, h: 0.36, fontFace: FONT, fontSize: 14, bold: true, color: INK, align: "center" });
  });
}

function trendChart(s: PptxGenJS.Slide, sec: Section, b: Box, digits: number) {
  const pts = sec.trend;
  s.addChart("bar", [{ name: "Utang usaha", labels: pts.map((p) => monthLabel(p.period, true)), values: pts.map((p) => +toM(p.amount).toFixed(2)) }], {
    x: b.x, y: b.y, w: b.w, h: b.h, barDir: "col", barGapWidthPct: 60,
    chartColors: pts.map((_, i) => (i === pts.length - 1 ? DARK_GREY : LIGHT_GREY)),
    showValue: true, dataLabelFormatCode: digits ? "#,##0.0" : "#,##0", dataLabelFontSize: 8, dataLabelColor: INK, dataLabelPosition: "outEnd",
    catAxisLabelFontSize: 8, catAxisLabelFontFace: FONT, valAxisHidden: true, valGridLine: { style: "none" }, showLegend: false,
  });
}

/** Batang horizontal rata kiri, lebar seragam, warna menurut peringkat. */
function hbar(s: PptxGenJS.Slide, rows: { label: string; amount: number }[], b: Box, digits: number) {
  if (!rows.length) {
    s.addText("Tidak ada saldo", { x: b.x, y: b.y, w: b.w, h: b.h, fontFace: FONT, fontSize: 10, color: MUTED, align: "center", valign: "middle" });
    return;
  }
  const r = [...rows].reverse(); // pptx menggambar kategori dari bawah
  const values = r.map((x) => +toM(x.amount).toFixed(digits === 0 ? 2 : 3));
  // Tebal batang seragam: tinggi grafik mengikuti jumlah baris dan menempel di atas panel.
  const h = Math.min(b.h, 0.22 * r.length + 0.2);
  s.addChart("bar", [{ name: "Nilai", labels: r.map((x) => (x.label.length > 30 ? x.label.slice(0, 29) + "…" : x.label)), values }], {
    x: b.x, y: b.y, w: b.w, h, barDir: "bar", barGapWidthPct: 45, chartColors: rankColors(values), catAxisLabelFrequency: "1",
    showValue: true, dataLabelFormatCode: digits ? "#,##0.00" : "#,##0", dataLabelFontSize: 7.5, dataLabelColor: INK, dataLabelPosition: "outEnd",
    catAxisLabelFontSize: 7.5, catAxisLabelFontFace: FONT, valAxisHidden: true, valGridLine: { style: "none" }, showLegend: false,
    catAxisLineShow: false,
  });
}

function pie(s: PptxGenJS.Slide, rows: { label: string; amount: number }[], b: Box) {
  const rs = rows.filter((r) => r.amount > 0);
  if (!rs.length) {
    s.addText("Tidak ada saldo", { x: b.x, y: b.y, w: b.w, h: b.h, fontFace: FONT, fontSize: 10, color: MUTED, align: "center", valign: "middle" });
    return;
  }
  const values = rs.map((r) => +toM(r.amount).toFixed(3));
  s.addChart("pie", [{ name: "Komposisi", labels: rs.map((r) => r.label), values }], {
    x: b.x, y: b.y, w: b.w, h: b.h, chartColors: rankColors(values).map((c) => (c === REST ? "7F7F7F" : c)),
    showPercent: true, showValue: false, showLabel: true, dataLabelFontSize: 8, dataLabelColor: "FFFFFF", showLegend: true, legendPos: "r", legendFontSize: 8,
  });
}

function conclusion(s: PptxGenJS.Slide, lines: string[], b: Box) {
  s.addText([
    { text: "Kesimpulan :", options: { bold: true, breakLine: true } },
    ...lines.map((l, i) => ({ text: l, options: { bullet: { indent: 12 }, breakLine: i < lines.length - 1 } })),
  ], { x: b.x, y: b.y, w: b.w, h: b.h, fontFace: FONT, fontSize: 9.5, color: INK, valign: "top", fill: { color: "F2F2F2" }, margin: [4, 8, 4, 8] });
}

export async function buildPpt(report: Report): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "AP Insight";
  pptx.company = "Unit of AR-AP Management and Liquidity"; // pptxgenjs tidak meng-escape & di docProps
  pptx.title = `Laporan Aging Utang Usaha Group AP Management per ${periodLabel(report.period)}`;

  const [bg, cover] = await Promise.all([
    readFile(path.join(process.cwd(), "assets/ppt/background.jpg")).catch(() => null),
    readFile(path.join(process.cwd(), "assets/ppt/cover.jpg")).catch(() => null),
  ]);
  const bgData = bg ? `data:image/jpeg;base64,${bg.toString("base64")}` : undefined;
  pptx.defineSlideMaster({ title: "CONTENT", background: bgData ? { data: bgData } : { color: "FFFFFF" } });
  const per = periodLabel(report.period);

  // 1. Cover
  const s1 = pptx.addSlide();
  s1.background = cover ? { data: `data:image/jpeg;base64,${cover.toString("base64")}` } : { color: "000000" };
  s1.addText(`Laporan Aging Utang Usaha Group AP Management per ${per}`, {
    x: 0.6, y: 2.2, w: 6.2, h: 1.8, fontFace: FONT, fontSize: 30, bold: true, color: "FFFFFF", valign: "top",
  });
  s1.addText("Unit of AR/AP Management & Liquidity\nDepartment of Treasury", { x: 0.6, y: 4.2, w: 6, h: 0.8, fontFace: FONT, fontSize: 14, color: "D9D9D9" });

  // 2. Daftar isi
  const s2 = pptx.addSlide({ masterName: "CONTENT" });
  slideTitle(s2, "DAFTAR ISI");
  const toc = [
    "Utang Usaha ke Pihak Ketiga, Afiliasi & BUMN SIG Konsolidasi", "Utang Usaha Pihak Ketiga SIG Konsolidasi", "Utang Usaha Afiliasi SIG Konsolidasi",
    "Utang Usaha ke BUMN SIG Konsolidasi", "Utang Usaha Interco SIG Konsolidasi", "Analisa Utang Usaha Interco > 365 Hari",
    "Laporan Tagihan PaDi Overdue (tahap 2)", "Laporan Outstanding SCF Pihak Ketiga (tahap 2)", "Laporan Outstanding SCF RO (tahap 2)",
  ];
  s2.addText(toc.map((t, i) => ({ text: t, options: { bullet: { type: "number" }, breakLine: i < toc.length - 1, color: t.includes("tahap 2") ? "A6A6A6" : INK } })), {
    x: 0.9, y: 1.4, w: 10, h: 4.8, fontFace: FONT, fontSize: 16, paraSpaceAfter: 8, valign: "top",
  });

  const L: Box = { x: 0.45, y: 1.25, w: 6.05, h: 2.45 };
  const R: Box = { x: 6.85, y: 1.25, w: 6.05, h: 2.45 };
  const LB: Box = { x: 0.45, y: 3.85, w: 6.05, h: 2.3 };
  const RB: Box = { x: 6.85, y: 3.85, w: 6.05, h: 2.3 };
  const inner = (b: Box): Box => ({ x: b.x, y: b.y + 0.4, w: b.w, h: b.h - 0.4 });
  const concl: Box = { x: 0.45, y: 6.18, w: 12.45, h: 0.62 };

  const categorySlide = (num: number, sec: Section, subject: string, heading: string, kind: "konsolidasi" | "kategori") => {
    const s = pptx.addSlide({ masterName: "CONTENT" });
    slideTitle(s, `${num}. ${heading} per ${per}`);
    panelTitle(s, `Status Tagihan ${subject}`, L);
    statusChevrons(s, sec, inner(L), 0);
    panelTitle(s, `Tren Kenaikan / Penurunan ${subject}`, R);
    trendChart(s, sec, inner(R), 0);
    if (kind === "konsolidasi") {
      panelTitle(s, "Utang Usaha Per Entitas", LB);
      hbar(s, sec.byOpco.map((o) => ({ label: o.code, amount: o.amount })), inner(LB), 0);
      panelTitle(s, "Utang Usaha Per Kategori Vendor", RB);
      pie(s, sec.byCat.map((c) => ({ label: c.cat, amount: c.amount })), inner(RB));
    } else {
      panelTitle(s, `TOP 10 ${subject} per OpCo`, LB);
      hbar(s, sec.byOpco.slice(0, 10).map((o) => ({ label: o.code, amount: o.amount })), inner(LB), 0);
      panelTitle(s, "TOP 10 Vendor", RB);
      hbar(s, sec.topVendors.map((v) => ({ label: v.name, amount: v.amount })), inner(RB), 0);
    }
    conclusion(s, kesimpulan(heading, sec, report.period, report.prevPeriod, report.decPeriod), concl);
  };

  categorySlide(1, report.konsolidasi, "Utang Usaha", "Utang Usaha SIG Konsolidasi", "konsolidasi");
  categorySlide(2, report.thirdParties, "Utang Usaha ke Pihak Ketiga", "Utang Usaha SIG ke Pihak Ketiga", "kategori");
  categorySlide(3, report.afiliasi, "Utang Usaha ke Afiliasi", "Utang Usaha SIG ke Pihak Afiliasi", "kategori");
  categorySlide(4, report.bumn, "Utang Usaha ke BUMN", "Utang Usaha SIG ke BUMN", "kategori");

  // Slide per OpCo: tiga kolom Pihak Ketiga / BUMN / Afiliasi.
  for (const code of report.opcoOrder) {
    const o = report.perOpco[code];
    const s = pptx.addSlide({ masterName: "CONTENT" });
    slideTitle(s, `${report.opcoNames[code] ?? code} per ${per}`);
    const cols: [string, Section][] = [["Pihak Ketiga", o.tp], ["BUMN", o.bumn], ["Afiliasi", o.afiliasi]];
    cols.forEach(([label, sec], i) => {
      const x = 0.45 + i * 4.2;
      const w = 4.0;
      panelTitle(s, `Status Tagihan ke ${label}`, { x, y: 1.2, w, h: 0.4 });
      const vals = [["Total", sec.total, "2D728F", "FFFFFF"], ["C&C", sec.status.cleanClear, STATUS.clean, "1F3A0F"], ["Verifikasi", sec.status.verifikasi, STATUS.verif, "3A3500"], ["Belum", sec.status.belumDitagihkan, STATUS.belum, "FFFFFF"]] as const;
      vals.forEach(([l, v, c, ink], j) => {
        s.addText([{ text: l + "\n", options: { fontSize: 7.5 } }, { text: smart(v), options: { fontSize: 10.5, bold: true } }], {
          x: x + j * 1.0, y: 1.6, w: 0.96, h: 0.62, fontFace: FONT, color: ink, align: "center", valign: "middle", fill: { color: c }, margin: 0.02,
        });
      });
      panelTitle(s, `Jenis Pembayaran ke ${label}`, { x, y: 2.35, w, h: 0.4 });
      pie(s, [{ label: "TT", amount: sec.payment.TT }, { label: "SCF", amount: sec.payment.SCF }, { label: "SKBDN", amount: sec.payment.SKBDN }], { x, y: 2.72, w, h: 1.45 });
      panelTitle(s, "TOP 10 Vendor", { x, y: 4.25, w, h: 0.4 });
      hbar(s, sec.topVendors.map((v) => ({ label: v.name, amount: v.amount })), { x, y: 4.62, w, h: 2.3 }, 2);
    });
  }

  categorySlide(5, report.interco, "Utang Usaha Interco", "Utang Usaha Interco SIG", "kategori");

  // 6. Analisa Interco > 365 hari
  const s6 = pptx.addSlide({ masterName: "CONTENT" });
  slideTitle(s6, `6. Analisa Utang Usaha Interco > 365 Hari per ${per}`);
  const rows = report.intercoOver365;
  hbar(s6, rows.map((r) => ({ label: r.code, amount: r.amount })), { x: 0.45, y: 1.35, w: 6.2, h: 4.9 }, 2);
  const bullets = rows.map((r) => `${r.code} memiliki utang usaha Interco berumur > 365 hari ${smart(r.amount)} M`);
  bullets.push("Untuk utang usaha berumur lama perlu dilakukan inisiasi penyelesaian baik melalui skema net off, sweeping, maupun fund flow.");
  s6.addText(bullets.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < bullets.length - 1, bold: i === bullets.length - 1 } })), {
    x: 6.95, y: 1.35, w: 5.95, h: 4.9, fontFace: FONT, fontSize: 11, color: INK, valign: "top", paraSpaceAfter: 6,
  });

  const out = await pptx.write({ outputType: "nodebuffer" });
  return out as Buffer;
}
