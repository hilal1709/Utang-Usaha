import type { Bucket } from "./constants";

const DAY = 86400000;
const toMs = (iso: string) => Date.parse(iso + "T00:00:00Z");
export const addDays = (iso: string, days: number) => new Date(toMs(iso) + days * DAY).toISOString().slice(0, 10);
export const daysBetween = (fromIso: string, toIso: string) => Math.round((toMs(toIso) - toMs(fromIso)) / DAY);

export function endOfMonth(iso: string, addMonths = 0) {
  const d = new Date(toMs(iso));
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1 + addMonths, 0)).toISOString().slice(0, 10);
}

/** Due date: dari file; jika kosong → posting date + TOP; jika belum ditagihkan → akhir bulan berikutnya dari periode. */
export function resolveDueDate(o: { dueDate: string | null; postingDate: string | null; top: number | null; belumDitagihkan: boolean; period: string }) {
  if (o.dueDate) return { dueDate: o.dueDate, filled: false };
  if (o.belumDitagihkan) return { dueDate: endOfMonth(o.period, 1), filled: true };
  if (o.postingDate && o.top != null) return { dueDate: addDays(o.postingDate, o.top), filled: true };
  return { dueDate: null, filled: false };
}

export function bucketFor(umur: number | null): Bucket {
  if (umur == null || umur <= 0) return "Belum Jatuh Tempo";
  if (umur <= 45) return "1-45 hari";
  if (umur <= 135) return "46-135 hari";
  if (umur <= 365) return "136-365 hari";
  return "> 365 hari";
}

/** Umur = akhir bulan periode − due date; Range TOP bila umur ≤ 0, >TOP bila > 0. */
export function deriveAging(period: string, dueDate: string | null, belumDitagihkan: boolean) {
  const umur = dueDate ? daysBetween(dueDate, period) : null;
  const rangeTop = umur != null && umur > 0 ? ">TOP" : "Range TOP";
  const jatuhTempo2 = belumDitagihkan ? "Belum Ditagihkan" : umur != null && umur >= 1 ? "Telah Jatuh Tempo" : "Belum Jatuh Tempo";
  return { umur, rangeTop, jatuhTempo2, bucket: bucketFor(umur) };
}

/** Kolom umur template OpCo (R–W) → bucket sistem; R "Belum ditagih" bukan bucket umur. */
export const TEMPLATE_BUCKET_KEYS = [
  ["bBelumTagih", null],
  ["bBelumJt", "Belum Jatuh Tempo"],
  ["b1_45", "1-45 hari"],
  ["b46_135", "46-135 hari"],
  ["b136_365", "136-365 hari"],
  ["b365", "> 365 hari"],
] as const;
