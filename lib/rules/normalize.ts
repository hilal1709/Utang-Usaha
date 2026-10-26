import type { KategoriVendor } from "./constants";

export type Fix = { from: string; to: string };

const squash = (s: string) => s.replace(/\s+/g, " ").trim();
export const looseKey = (s: string) => squash(s).toLowerCase().replace(/[^a-z0-9&]/g, "");

function pick<T extends string>(raw: unknown, table: Record<string, T>): { value: T | null; raw: string; fix?: Fix } {
  const text = raw == null ? "" : squash(String(raw));
  if (!text) return { value: null, raw: text };
  const hit = table[looseKey(text)];
  if (!hit) return { value: null, raw: text };
  return { value: hit, raw: text, fix: hit !== text ? { from: text, to: hit } : undefined };
}

const KV: Record<string, KategoriVendor> = {
  thirdparties: "Third Parties", thirdparty: "Third Parties", swasta: "Third Parties", pihakketiga: "Third Parties",
  afiliasi: "Afiliasi", affiliasi: "Afiliasi", relafiliasi: "Afiliasi",
  bumn: "BUMN",
  interco: "Interco", intercompany: "Interco", relintercocement: "Interco", relintercononcement: "Interco",
};
export const normKategoriVendor = (v: unknown) => pick(v, KV);

export const normKategoriTransaksi = (v: unknown) =>
  pick(v, { thirdparties: "Third Parties", thirdparty: "Third Parties", ics: "ICS", interco: "ICS" } as Record<string, "Third Parties" | "ICS">);

export const normJenisTransaksi = (v: unknown) =>
  pick(v, { semen: "Semen", nonsemen: "Non Semen" } as Record<string, "Semen" | "Non Semen">);

export const normJenisPembayaran = (v: unknown) =>
  pick(v, { tt: "TT", transfer: "TT", scf: "SCF", skbdn: "SKBDN" } as Record<string, "TT" | "SCF" | "SKBDN">);

/** Kategori Transaksi baku: Interco → ICS, selain itu Third Parties (Afiliasi & BUMN termasuk Third Parties). */
export const expectedKategoriTransaksi = (kv: KategoriVendor) => (kv === "Interco" ? "ICS" : "Third Parties");

export type PosisiResult = {
  posisi: "Dokumen di Bendahara" | "Dokumen di Verifikasi" | "Belum Ditagihkan";
  status: "Siap Bayar" | "Dokumen di Verifikasi" | "Belum Ditagihkan";
  masalah: "Clean & Clear" | "Proses Verifikasi Tagihan" | "Belum Ditagihkan";
};

/**
 * Posisi & status dokumen mengikuti "Catatan Penyusunan Laporan Utang":
 * posisi 0/#N/A/belum diekspedisikan/GR-IR/cancel/dokumen kembali/tidak lengkap → Belum Ditagihkan,
 * kecuali status Siap Bayar/Paid yang berarti dokumen sudah di Bendahara;
 * posisi di Verifikasi + status Siap Bayar → di Bendahara.
 */
export function normPosisiStatus(posisiRaw: unknown, statusRaw: unknown): PosisiResult | null {
  const p = looseKey(String(posisiRaw ?? ""));
  const s = looseKey(String(statusRaw ?? ""));
  const siapBayar = s === "siapbayar" || s === "paid";

  let posisi: PosisiResult["posisi"] | null = null;
  if (p.includes("bendahara")) posisi = "Dokumen di Bendahara";
  else if (p.includes("verifikasi")) posisi = siapBayar ? "Dokumen di Bendahara" : "Dokumen di Verifikasi";
  else if (
    p === "" || p === "0" || p === "na" || p.includes("belumditagih") || p.includes("belumdiekspedisi") ||
    p.includes("grir") || p.includes("cancel") || p.includes("kembali") || p.includes("tidaklengkap")
  ) posisi = siapBayar ? "Dokumen di Bendahara" : "Belum Ditagihkan";

  if (!posisi) return null;
  if (posisi === "Dokumen di Bendahara") return { posisi, status: "Siap Bayar", masalah: "Clean & Clear" };
  if (posisi === "Dokumen di Verifikasi") return { posisi, status: "Dokumen di Verifikasi", masalah: "Proses Verifikasi Tagihan" };
  return { posisi, status: "Belum Ditagihkan", masalah: "Belum Ditagihkan" };
}

/** Standarisasi nama vendor: tanpa PT/Tbk/CV, spasi rapi, Title Case bila input huruf besar semua. */
export function normVendorName(raw: unknown): { name: string; key: string } {
  let s = squash(String(raw ?? ""));
  s = s
    .replace(/^(PT|P\.T\.|CV)[.\s]+/i, "")
    .replace(/[,.\s]+(PT|P\.T|TBK|CV|\(PERSERO\)|PERSERO)\.?$/i, "")
    .replace(/[,.\s]+(PT|TBK)\.?$/i, "")
    .trim();
  if (s && s === s.toUpperCase() && /[A-Z]/.test(s)) s = s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());
  return { name: s, key: vendorKey(s) };
}

export const vendorKey = (s: string) =>
  s.toLowerCase().replace(/\b(pt|tbk|cv|persero)\b/g, "").replace(/[^a-z0-9]/g, "");

export function parseNumber(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  let s = String(raw).trim().replace(/\s/g, "").replace(/^Rp\.?/i, "");
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (s === "-") return 0;
  // Format Indonesia 1.234.567,89 vs internasional 1,234,567.89
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
  else s = s.replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return neg ? -n : n;
}

/** Tanggal → ISO yyyy-mm-dd. Menerima Date, serial Excel, yyyy-mm-dd, dd-mm-yyyy, dd/mm/yyyy, dd.mm.yyyy. */
export function parseDate(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw.toISOString().slice(0, 10);
  if (typeof raw === "number") {
    if (raw < 20000 || raw > 80000) return null;
    return new Date(Date.UTC(1899, 11, 30) + Math.round(raw) * 86400000).toISOString().slice(0, 10);
  }
  const s = String(raw).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (m) return iso(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
  return null;
}

function iso(y: number, mo: number, d: number) {
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
}

export const cellText = (raw: unknown) => (raw == null ? "" : raw instanceof Date ? raw.toISOString().slice(0, 10) : squash(String(raw)));
