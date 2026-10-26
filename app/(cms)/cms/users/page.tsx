import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { opcos, users } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/shell/page-header";
import { UserManager } from "./user-manager";
import { AccessMatrix } from "./access-matrix";

export const metadata: Metadata = { title: "Akun & hak akses" };

export default async function UsersPage() {
  const me = await requireUser(["SUPERADMIN"]);
  const [rows, opcoRows] = await Promise.all([
    db.select({
      id: users.id, name: users.name, email: users.email, role: users.role, opcoCode: users.opcoCode,
      active: users.active, lastLoginAt: users.lastLoginAt, createdAt: users.createdAt,
    }).from(users).orderBy(asc(users.role), asc(users.email)),
    db.select({ code: opcos.code, name: opcos.name }).from(opcos).orderBy(asc(opcos.sortOrder)),
  ]);
  return (
    <>
      <PageHeader
        title="Akun & hak akses"
        description="Setiap OpCo memakai akunnya sendiri dan hanya melihat data OpCo tersebut. Kata sandi baru ditampilkan sekali — sampaikan lewat kanal aman."
      />
      <div className="space-y-6 px-4 pb-14 sm:px-8">
        <UserManager
          me={me.id}
          opcos={opcoRows}
          rows={rows.map((r) => ({ ...r, lastLoginAt: r.lastLoginAt?.toISOString() ?? null, createdAt: r.createdAt.toISOString() }))}
        />
        <AccessMatrix />
      </div>
    </>
  );
}
