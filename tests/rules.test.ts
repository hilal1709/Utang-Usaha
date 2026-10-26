import { describe, expect, it } from "vitest";
import { bucketFor, deriveAging, resolveDueDate } from "@/lib/rules/derive";
import { normJenisTransaksi, normPosisiStatus, normVendorName, parseDate, parseNumber } from "@/lib/rules/normalize";

describe("aging", () => {
  const period = "2026-08-31";
  it("menghitung umur dari akhir bulan periode", () => {
    expect(deriveAging(period, "2026-08-12", false)).toMatchObject({ umur: 19, rangeTop: ">TOP", jatuhTempo2: "Telah Jatuh Tempo", bucket: "1-45 hari" });
    expect(deriveAging(period, "2026-09-09", false)).toMatchObject({ umur: -9, rangeTop: "Range TOP", jatuhTempo2: "Belum Jatuh Tempo", bucket: "Belum Jatuh Tempo" });
    expect(deriveAging(period, "2026-05-22", false).bucket).toBe("46-135 hari");
  });
  it("batas bucket", () => {
    expect(bucketFor(0)).toBe("Belum Jatuh Tempo");
    expect(bucketFor(45)).toBe("1-45 hari");
    expect(bucketFor(46)).toBe("46-135 hari");
    expect(bucketFor(136)).toBe("136-365 hari");
    expect(bucketFor(366)).toBe("> 365 hari");
    // belum ditagihkan tetap punya umur (metode file Gabungan)
    expect(deriveAging("2026-08-31", "2025-01-31", true)).toMatchObject({ bucket: "> 365 hari", jatuhTempo2: "Belum Ditagihkan" });
  });
  it("mengisi due date kosong", () => {
    expect(resolveDueDate({ dueDate: null, postingDate: "2026-07-01", top: 30, belumDitagihkan: false, period }).dueDate).toBe("2026-07-31");
    expect(resolveDueDate({ dueDate: null, postingDate: "2026-07-01", top: 30, belumDitagihkan: true, period }).dueDate).toBe("2026-09-30");
  });
});

describe("normalisasi", () => {
  it("posisi & status dokumen", () => {
    expect(normPosisiStatus("Dokumen Di Bendahara", "Siap Bayar")?.masalah).toBe("Clean & Clear");
    expect(normPosisiStatus("dokumen di verifikasi", "")?.masalah).toBe("Proses Verifikasi Tagihan");
    expect(normPosisiStatus("Dokumen di Verifikasi", "Siap Bayar")?.posisi).toBe("Dokumen di Bendahara");
    expect(normPosisiStatus("0", "0")?.masalah).toBe("Belum Ditagihkan");
    expect(normPosisiStatus("Dokumen belum diekspedisikan", "Paid")?.posisi).toBe("Dokumen di Bendahara");
    expect(normPosisiStatus("#N/A", "")?.masalah).toBe("Belum Ditagihkan");
    expect(normPosisiStatus("Di meja direksi", "x")).toBeNull();
  });
  it("vendor tanpa PT", () => {
    expect(normVendorName("REKAYASA ENGINEERING.PT").name).toBe("Rekayasa Engineering");
    expect(normVendorName("PT Semen Indonesia (Persero) Tbk").name).toBe("Semen Indonesia (Persero)");
    expect(normVendorName("Angkasa Pura Suport").name).toBe("Angkasa Pura Suport");
  });
  it("jenis transaksi tidak peka huruf", () => {
    expect(normJenisTransaksi("Non semen").value).toBe("Non Semen");
    expect(normJenisTransaksi("NON SEMEN").value).toBe("Non Semen");
  });
  it("angka & tanggal", () => {
    expect(parseNumber("1.234.567,50")).toBe(1234567.5);
    expect(parseNumber("(1,000)")).toBe(-1000);
    expect(parseNumber("abc")).toBeNull();
    expect(parseDate("12-08-2026")).toBe("2026-08-12");
    expect(parseDate("31/02/2026")).toBeNull();
    expect(parseDate(46265)).toBe("2026-08-31");
  });
});
