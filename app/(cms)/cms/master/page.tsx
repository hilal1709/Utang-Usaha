import type { Metadata } from "next";
import { asc, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { opcos, vendorMaster } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/shell/page-header";
import { OpcoEditor, VendorEditor } from "./editors";

export const metadata: Metadata = { title: "Master data" };

export default async function MasterPage({ searchParams }: PageProps<"/cms/master">) {
  await requireUser(["ADMIN"]);
  const q = (await searchParams).q;
  const term = typeof q === "string" ? q.trim() : "";
  const [opcoRows, vendors, [{ n }]] = await Promise.all([
    db.select().from(opcos).orderBy(asc(opcos.sortOrder)),
    db.select().from(vendorMaster).where(term ? ilike(vendorMaster.standardName, `%${term}%`) : undefined).orderBy(asc(vendorMaster.standardName)).limit(80),
    db.select({ n: sql<number>`count(*)::int` }).from(vendorMaster),
  ]);
  return (
    <>
      <PageHeader title="Master data" description="CoCd per OpCo dipakai untuk menolak baris milik entitas lain; master vendor dipakai untuk standarisasi nama & kategori." />
      <div className="grid gap-6 px-4 pb-14 sm:px-8 2xl:grid-cols-2">
        <OpcoEditor rows={opcoRows.map((o) => ({ code: o.code, name: o.name, cocds: o.cocds.join(", "), active: o.active }))} />
        <VendorEditor rows={vendors.map((v) => ({ key: v.key, name: v.standardName, kategori: v.kategoriVendor ?? "" }))} total={n} term={term} />
      </div>
    </>
  );
}
