export const KATEGORI_VENDOR = ["Third Parties", "Afiliasi", "BUMN", "Interco"] as const;
export const KATEGORI_TRANSAKSI = ["Third Parties", "ICS"] as const;
export const JENIS_TRANSAKSI = ["Semen", "Non Semen"] as const;
export const JENIS_PEMBAYARAN = ["TT", "SCF", "SKBDN"] as const;
export const MASALAH = ["Clean & Clear", "Proses Verifikasi Tagihan", "Belum Ditagihkan"] as const;

/** Bucket umur dihitung dari due date untuk semua baris (termasuk yang belum ditagihkan), sama dengan file Gabungan. */
export const BUCKETS = ["Belum Jatuh Tempo", "1-45 hari", "46-135 hari", "136-365 hari", "> 365 hari"] as const;
export type Bucket = (typeof BUCKETS)[number];
export const OVERDUE_BUCKETS: Bucket[] = ["1-45 hari", "46-135 hari", "136-365 hari", "> 365 hari"];

export type KategoriVendor = (typeof KATEGORI_VENDOR)[number];
export type Masalah = (typeof MASALAH)[number];

export type TemplateKey =
  | "cocd" | "top" | "umur" | "vendor" | "docNumber" | "invoice" | "description" | "documentDate" | "postingDate"
  | "dueDate" | "amount" | "kategoriVendor" | "kategoriTransaksi" | "jenisTransaksi" | "jenisPembayaran"
  | "posisiDokumen" | "statusDokumen" | "bBelumTagih" | "bBelumJt" | "b1_45" | "b46_135" | "b136_365" | "b365"
  | "total" | "ketMasalah" | "ketLain";

/**
 * Kolom template sheet `Detail` (A–Z). `aliases` dipakai mendeteksi kolom yang bergeser:
 * header baris 10 dicocokkan ke alias, bukan ke posisi huruf saja.
 */
export const TEMPLATE_COLUMNS: { col: string; key: TemplateKey; label: string; required: boolean; aliases: string[] }[] = [
  { col: "A", key: "cocd", label: "CoCd", required: true, aliases: ["cocd", "companycode", "kodeopco"] },
  { col: "B", key: "top", label: "TOP", required: true, aliases: ["top", "timeofpayment", "termofpayment"] },
  { col: "C", key: "umur", label: "Umur/Aging Hutang", required: false, aliases: ["umuraginghutang", "umur", "aging"] },
  { col: "D", key: "vendor", label: "Nama Vendor", required: true, aliases: ["namavendor", "vendor", "vendorname"] },
  { col: "E", key: "docNumber", label: "Doc. Number", required: true, aliases: ["docnumber", "documentnumber", "nodokumen"] },
  { col: "F", key: "invoice", label: "Nomor Invoice", required: false, aliases: ["nomorinvoice", "noinvoice", "invoice"] },
  { col: "G", key: "description", label: "Description Text", required: false, aliases: ["descriptiontext", "description", "keterangan"] },
  { col: "H", key: "documentDate", label: "Document Date", required: false, aliases: ["documentdate", "docdate", "tanggaldokumen"] },
  { col: "I", key: "postingDate", label: "Posting Date", required: true, aliases: ["postingdate", "tanggalposting"] },
  { col: "J", key: "dueDate", label: "Due Date", required: false, aliases: ["duedate", "jatuhtempo", "tanggaljatuhtempo"] },
  { col: "K", key: "amount", label: "Amount", required: true, aliases: ["amount", "nilai", "nilaitagihan", "amountinlc"] },
  { col: "L", key: "kategoriVendor", label: "Kategori Vendor", required: true, aliases: ["kategorivendor"] },
  { col: "M", key: "kategoriTransaksi", label: "Kategori Transaksi", required: true, aliases: ["kategoritransaksi"] },
  { col: "N", key: "jenisTransaksi", label: "Jenis Transaksi", required: true, aliases: ["jenistransaksi"] },
  { col: "O", key: "jenisPembayaran", label: "Jenis Pembayaran", required: true, aliases: ["jenispembayaran"] },
  { col: "P", key: "posisiDokumen", label: "Posisi Dokumen", required: true, aliases: ["posisidokumen"] },
  { col: "Q", key: "statusDokumen", label: "Status Dokumen", required: true, aliases: ["statusdokumen"] },
  { col: "R", key: "bBelumTagih", label: "Belum ditagih", required: false, aliases: ["umurhutang", "belumditagih"] },
  { col: "S", key: "bBelumJt", label: "Belum JT", required: false, aliases: [] },
  { col: "T", key: "b1_45", label: "1-45 Days", required: false, aliases: [] },
  { col: "U", key: "b46_135", label: "46-135 Days", required: false, aliases: [] },
  { col: "V", key: "b136_365", label: "136-365 Days", required: false, aliases: [] },
  { col: "W", key: "b365", label: "Over 365 Days", required: false, aliases: [] },
  { col: "X", key: "total", label: "TOTAL", required: false, aliases: ["total"] },
  { col: "Y", key: "ketMasalah", label: "Keterangan Masalah", required: false, aliases: ["keteranganmasalah"] },
  { col: "Z", key: "ketLain", label: "Keterangan atas Lain-lain", required: false, aliases: ["keteranganataslainlain", "keteranganlainlain"] },
];
export const HEADER_ROW = 10;
export const FIRST_DATA_ROW = 13;
