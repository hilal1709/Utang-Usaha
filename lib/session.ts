import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import type { Role } from "@/auth.config";
import { db } from "@/db";
import { users } from "@/db/schema";
import { roleAllowed } from "@/lib/access";

/**
 * Sesi JWT dicocokkan ulang dengan tabel users (sekali per request) agar perubahan peran,
 * OpCo, atau penonaktifan akun langsung berlaku tanpa menunggu login ulang.
 */
const currentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  const [row] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, opcoCode: users.opcoCode, active: users.active })
    .from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!row?.active) return null;
  return { id: row.id, name: row.name, email: row.email, role: row.role as Role, opcoCode: row.opcoCode };
});

export type SessionUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

/** Ambil sesi dan pastikan peran diizinkan; dipakai di server component dan action. */
export async function requireUser(roles?: Role[]) {
  const user = await currentUser();
  if (!user) redirect("/keluar"); // hapus cookie sesi lama lalu ke /login
  if (!roleAllowed(user.role, roles)) redirect("/cms");
  return user;
}

export async function apiUser(roles?: Role[]) {
  const user = await currentUser();
  if (!user || !roleAllowed(user.role, roles)) return null;
  return user;
}
