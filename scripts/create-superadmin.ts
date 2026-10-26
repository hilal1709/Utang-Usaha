/**
 * Buat (atau naikkan peran) akun SUPERADMIN. Kata sandi sementara ditulis ke superadmin-credentials.txt
 * (di-gitignore) — sampaikan lewat kanal aman, ganti di halaman Akun saya, lalu hapus filenya.
 *
 *   npx tsx --env-file=.env.local scripts/create-superadmin.ts [email] ["Nama"]
 */
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

async function main() {
  const email = (process.argv[2] ?? "superadmin@apinsight.local").trim().toLowerCase();
  const name = process.argv[3] ?? "Superadmin";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error(`Email tidak valid: ${email}`);
  const pw = randomBytes(12).toString("base64url");
  const passwordHash = await bcrypt.hash(pw, 10);
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) {
    await db.update(users).set({ role: "SUPERADMIN", opcoCode: null, active: true, passwordHash }).where(eq(users.id, existing.id));
  } else {
    await db.insert(users).values({ email, name, role: "SUPERADMIN", opcoCode: null, passwordHash });
  }
  writeFileSync("superadmin-credentials.txt", `# Kredensial SUPERADMIN — ganti di /cms/akun lalu hapus file ini.\n${email} ${pw}\n`);
  console.log(`${existing ? "Akun dinaikkan" : "Akun dibuat"}: ${email} (SUPERADMIN). Kata sandi sementara → superadmin-credentials.txt`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
