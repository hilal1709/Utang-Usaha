"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, count, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { dataEvents, opcos, periods, submissions, users, vendorMaster } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { normKategoriVendor, normVendorName } from "@/lib/rules/normalize";
import { invalidateVendorCache } from "@/lib/upload/server";

export type ActionResult = { ok: true; message: string; secret?: string } | { ok: false; message: string };

const fail = (message: string): ActionResult => ({ ok: false, message });

export async function setPeriodLock(period: string, locked: boolean): Promise<ActionResult> {
  await requireUser(["ADMIN"]);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(period)) return fail("Periode tidak valid.");
  await db.insert(periods).values({ period, status: locked ? "locked" : "open" })
    .onConflictDoUpdate({ target: periods.period, set: { status: locked ? "locked" : "open" } });
  await db.insert(dataEvents).values({ kind: locked ? "period_locked" : "period_opened", period, message: `Periode ${period} ${locked ? "dikunci" : "dibuka"}` });
  revalidatePath("/cms", "layout");
  return { ok: true, message: locked ? "Periode dikunci. OpCo tidak bisa mengunggah lagi." : "Periode dibuka kembali." };
}

const opcoSchema = z.object({
  code: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  cocds: z.string().max(200),
  active: z.boolean(),
});

export async function updateOpco(input: z.infer<typeof opcoSchema>): Promise<ActionResult> {
  await requireUser(["ADMIN"]);
  const p = opcoSchema.safeParse(input);
  if (!p.success) return fail("Nama OpCo minimal 2 karakter.");
  const cocds = [...new Set(p.data.cocds.split(/[\s,;]+/).map((c) => c.trim()).filter(Boolean))];
  if (cocds.some((c) => !/^[A-Za-z0-9]{2,8}$/.test(c))) return fail("CoCd hanya huruf/angka 2–8 karakter, pisahkan dengan koma.");
  await db.update(opcos).set({ name: p.data.name, cocds, active: p.data.active }).where(eq(opcos.code, p.data.code));
  await db.insert(dataEvents).values({ kind: "master_updated", opcoCode: p.data.code, message: `Master OpCo ${p.data.code} diperbarui` });
  revalidatePath("/cms/master");
  return { ok: true, message: `${p.data.code} disimpan.` };
}

export async function upsertVendor(input: { name: string; kategori: string }): Promise<ActionResult> {
  await requireUser(["ADMIN"]);
  const v = normVendorName(input.name);
  const k = normKategoriVendor(input.kategori).value;
  if (!v.key || v.name.length < 2) return fail("Nama vendor wajib diisi.");
  if (!k) return fail("Pilih kategori vendor.");
  await db.insert(vendorMaster).values({ key: v.key, standardName: v.name, kategoriVendor: k })
    .onConflictDoUpdate({ target: vendorMaster.key, set: { standardName: v.name, kategoriVendor: k } });
  invalidateVendorCache();
  revalidatePath("/cms/master");
  return { ok: true, message: `${v.name} disimpan sebagai ${k}.` };
}

export async function deleteVendor(key: string): Promise<ActionResult> {
  await requireUser(["ADMIN"]);
  await db.delete(vendorMaster).where(eq(vendorMaster.key, key));
  invalidateVendorCache();
  revalidatePath("/cms/master");
  return { ok: true, message: "Vendor dihapus dari master." };
}

const ROLES = ["SUPERADMIN", "ADMIN", "OPCO", "VIEWER"] as const;

const userSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(ROLES),
  opcoCode: z.string().nullable(),
});

const newPassword = () => randomBytes(9).toString("base64url");
const opcoFor = (role: string, opcoCode: string | null) => (role === "OPCO" ? opcoCode : null);

async function opcoExists(code: string | null) {
  if (!code) return false;
  const [o] = await db.select({ code: opcos.code }).from(opcos).where(eq(opcos.code, code));
  return !!o;
}

/** Jumlah SUPERADMIN aktif selain `exceptId` — dijaga minimal satu agar sistem tidak terkunci. */
async function otherActiveSuperadmins(exceptId: string) {
  const [r] = await db.select({ n: count() }).from(users)
    .where(and(eq(users.role, "SUPERADMIN"), eq(users.active, true), ne(users.id, exceptId)));
  return r?.n ?? 0;
}

export async function createUser(input: z.infer<typeof userSchema>): Promise<ActionResult> {
  await requireUser(["SUPERADMIN"]);
  const p = userSchema.safeParse(input);
  if (!p.success) return fail("Periksa nama (min. 2 karakter) dan format email.");
  if (p.data.role === "OPCO" && !(await opcoExists(p.data.opcoCode))) return fail("Akun OpCo wajib dihubungkan ke satu OpCo.");
  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, p.data.email));
  if (exists) return fail("Email sudah terdaftar.");
  const pw = newPassword();
  await db.insert(users).values({ ...p.data, opcoCode: opcoFor(p.data.role, p.data.opcoCode), passwordHash: await bcrypt.hash(pw, 10) });
  revalidatePath("/cms/users");
  return { ok: true, message: `Akun ${p.data.email} dibuat.`, secret: pw };
}

const updateSchema = userSchema.omit({ email: true }).extend({ id: z.string().uuid() });

export async function updateUser(input: z.infer<typeof updateSchema>): Promise<ActionResult> {
  const me = await requireUser(["SUPERADMIN"]);
  const p = updateSchema.safeParse(input);
  if (!p.success) return fail("Nama minimal 2 karakter dan peran harus valid.");
  if (p.data.role === "OPCO" && !(await opcoExists(p.data.opcoCode))) return fail("Akun OpCo wajib dihubungkan ke satu OpCo.");
  const [cur] = await db.select({ role: users.role }).from(users).where(eq(users.id, p.data.id));
  if (!cur) return fail("Pengguna tidak ditemukan.");
  if (cur.role === "SUPERADMIN" && p.data.role !== "SUPERADMIN") {
    if (p.data.id === me.id) return fail("Anda tidak bisa menurunkan peran akun sendiri.");
    if (!(await otherActiveSuperadmins(p.data.id))) return fail("Minimal harus ada satu Superadmin aktif.");
  }
  await db.update(users).set({ name: p.data.name, role: p.data.role, opcoCode: opcoFor(p.data.role, p.data.opcoCode) }).where(eq(users.id, p.data.id));
  revalidatePath("/cms/users");
  return { ok: true, message: "Hak akses diperbarui. Berlaku pada halaman berikutnya yang dibuka pengguna." };
}

export async function setUserActive(userId: string, active: boolean): Promise<ActionResult> {
  const me = await requireUser(["SUPERADMIN"]);
  if (me.id === userId && !active) return fail("Anda tidak bisa menonaktifkan akun sendiri.");
  const [cur] = await db.select({ role: users.role, email: users.email }).from(users).where(eq(users.id, userId));
  if (!cur) return fail("Pengguna tidak ditemukan.");
  if (!active && cur.role === "SUPERADMIN" && !(await otherActiveSuperadmins(userId))) return fail("Minimal harus ada satu Superadmin aktif.");
  await db.update(users).set({ active }).where(eq(users.id, userId));
  revalidatePath("/cms/users");
  return { ok: true, message: active ? `${cur.email} diaktifkan kembali.` : `${cur.email} dinonaktifkan dan langsung keluar dari aplikasi.` };
}

export async function resetPassword(userId: string): Promise<ActionResult> {
  await requireUser(["SUPERADMIN"]);
  const pw = newPassword();
  const res = await db.update(users).set({ passwordHash: await bcrypt.hash(pw, 10) }).where(eq(users.id, userId)).returning({ email: users.email });
  if (!res.length) return fail("Pengguna tidak ditemukan.");
  return { ok: true, message: `Kata sandi ${res[0].email} diatur ulang.`, secret: pw };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const me = await requireUser(["SUPERADMIN"]);
  if (me.id === userId) return fail("Anda tidak bisa menghapus akun sendiri.");
  const [cur] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  if (!cur) return fail("Pengguna tidak ditemukan.");
  if (cur.role === "SUPERADMIN" && !(await otherActiveSuperadmins(userId))) return fail("Minimal harus ada satu Superadmin aktif.");
  await db.update(submissions).set({ uploadedBy: null }).where(eq(submissions.uploadedBy, userId)); // riwayat unggah tetap ada
  await db.delete(users).where(eq(users.id, userId));
  revalidatePath("/cms/users");
  return { ok: true, message: "Akun dihapus." };
}

const ownSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

/** Akun saya: semua peran boleh mengubah nama tampilannya sendiri. */
export async function updateOwnProfile(input: z.infer<typeof ownSchema>): Promise<ActionResult> {
  const me = await requireUser();
  const p = ownSchema.safeParse(input);
  if (!p.success) return fail("Nama minimal 2 karakter.");
  await db.update(users).set({ name: p.data.name }).where(eq(users.id, me.id));
  revalidatePath("/", "layout");
  return { ok: true, message: "Nama diperbarui." };
}

const passwordSchema = z.object({
  current: z.string().min(1),
  next: z.string().min(10).max(128),
  confirm: z.string(),
});

export async function changeOwnPassword(input: z.infer<typeof passwordSchema>): Promise<ActionResult> {
  const me = await requireUser();
  const p = passwordSchema.safeParse(input);
  if (!p.success) return fail("Kata sandi baru minimal 10 karakter.");
  if (p.data.next !== p.data.confirm) return fail("Konfirmasi kata sandi tidak sama dengan kata sandi baru.");
  if (p.data.next === p.data.current) return fail("Kata sandi baru harus berbeda dari yang sekarang.");
  const [row] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, me.id));
  if (!row || !(await bcrypt.compare(p.data.current, row.hash))) return fail("Kata sandi saat ini salah.");
  await db.update(users).set({ passwordHash: await bcrypt.hash(p.data.next, 10) }).where(eq(users.id, me.id));
  return { ok: true, message: "Kata sandi diganti. Gunakan kata sandi baru saat masuk berikutnya." };
}
