import type { Section } from "@/lib/data/report";
import { periodLabel } from "@/lib/format";

const persen = (r: number) => `${Math.abs(r * 100).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

/** Kalimat "Kesimpulan" seperti di PPT: perubahan vs bulan lalu dan vs Desember tahun lalu. */
export function kesimpulan(subject: string, s: Section, period: string, prev: string, dec: string): string[] {
  const out: string[] = [];
  if (s.mom != null) out.push(`${subject} per ${periodLabel(period)} dibanding per ${periodLabel(prev)} ${s.mom >= 0 ? "naik" : "turun"} sebesar ${persen(s.mom)}.`);
  if (s.ytd != null) out.push(`${subject} per ${periodLabel(period)} dibanding per ${periodLabel(dec)} ${s.ytd >= 0 ? "naik" : "turun"} sebesar ${persen(s.ytd)}.`);
  if (!out.length) out.push(`${subject} per ${periodLabel(period)}: data pembanding bulan sebelumnya belum tersedia.`);
  return out;
}
