import { db } from "@/db";
import { vendorMaster } from "@/db/schema";
import { apiUser } from "@/lib/session";
import { json } from "@/lib/api";

/** Master vendor ringkas untuk standarisasi di browser (sama dengan yang dipakai server). */
export async function GET() {
  if (!(await apiUser())) return json({ error: "Tidak berhak." }, 401);
  const rows = await db.select().from(vendorMaster);
  return json(rows.map((r) => [r.key, r.standardName, r.kategoriVendor]));
}
