import type { Metadata } from "next";
import { and, asc, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { KATEGORI_VENDOR } from "@/lib/rules/constants";
import { opcos, vendorMaster } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/shell/page-header";
import { OpcoEditor, VendorEditor } from "./editors";

export const metadata: Metadata = { title: "Master data" };

export default async function MasterPage({ searchParams }: PageProps<"/cms/master">) {
  await requireUser(["ADMIN"]);
  const { q, kat: k } = await searchParams;
  const term = typeof q === "string" ? q.trim() : "";
  const kat = typeof k === "string" && (KATEGORI_VENDOR as readonly string[]).includes(k) ? k : "";
  const [opcoRows, vendors, counts] = await Promise.all([
    db.select().from(opcos).orderBy(asc(opcos.sortOrder)),
    db.select().from(vendorMaster)
      .where(and(term ? ilike(vendorMaster.standardName, `%${term}%`) : undefined, kat ? eq(vendorMaster.kategoriVendor, kat) : undefined))
      .orderBy(asc(vendorMaster.standardName)).limit(80),
    db.select({ kategori: vendorMaster.kategoriVendor, n: sql<number>`count(*)::int` }).from(vendorMaster).groupBy(vendorMaster.kategoriVendor),
  ]);
  const perKategori = Object.fromEntries(counts.map((c) => [c.kategori ?? "", c.n]));
  const n = counts.reduce((s, c) => s + c.n, 0);
  return (
    <>
      <PageHeader title="Master data" description="CoCd per OpCo dipakai untuk menolak baris milik entitas lain; master vendor dipakai untuk standarisasi nama & kategori." />
      <div className="grid gap-6 px-4 pb-14 sm:px-8 2xl:grid-cols-2">
        <OpcoEditor rows={opcoRows.map((o) => ({ code: o.code, name: o.name, cocds: o.cocds.join(", "), active: o.active }))} />
        <VendorEditor rows={vendors.map((v) => ({ key: v.key, name: v.standardName, kategori: v.kategoriVendor ?? "" }))} total={n} term={term} kat={kat} counts={perKategori} />
      </div>
    </>
  );
}
