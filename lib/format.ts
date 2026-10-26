const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** Rupiah dalam Milyar: 7278472269799 → "7.278" (digits=0) / "7.278,47". */
export function milyar(n: number, digits = 0) {
  const v = n / 1e9;
  if (Math.abs(v) < 0.005 && digits <= 2) return "-";
  return v.toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Milyar dengan presisi adaptif untuk nilai kecil (0,02 M) seperti slide OpCo. */
export function milyarAuto(n: number) {
  const v = Math.abs(n / 1e9);
  if (v === 0) return "-";
  return milyar(n, v >= 100 ? 0 : v >= 1 ? 2 : v >= 0.01 ? 2 : 3);
}

export const rp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

export function pct(r: number | null | undefined, digits = 2) {
  if (r == null || !Number.isFinite(r)) return "–";
  return `${r > 0 ? "+" : ""}${(r * 100).toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}

export function share(part: number, total: number) {
  if (!total) return "0%";
  return `${((part / total) * 100).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;
}

export function periodLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${BULAN[m - 1]} ${y}`;
}
export function monthLabel(iso: string, short = false) {
  const [y, m] = iso.split("-").map(Number);
  return short ? `${BULAN_PENDEK[m - 1]} ${String(y).slice(2)}` : `${BULAN[m - 1]} ${y}`;
}

export const naikTurun = (r: number | null) => (r == null ? "tetap" : r >= 0 ? "naik" : "turun");

export function relTime(iso: string | Date) {
  const t = typeof iso === "string" ? new Date(iso) : iso;
  const s = Math.round((Date.now() - t.getTime()) / 1000);
  if (s < 60) return "baru saja";
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  return t.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
