import type { Role } from "@/auth.config";

type Scoped = { role: Role; opcoCode: string | null };

export const ROLE_LABEL: Record<Role, string> = {
  SUPERADMIN: "Superadmin",
  ADMIN: "Admin Treasury",
  OPCO: "OpCo",
  VIEWER: "Pimpinan",
};

/** SUPERADMIN mewarisi semua hak ADMIN. */
export const isAdmin = (role: Role | undefined | null) => role === "ADMIN" || role === "SUPERADMIN";

/** Apakah peran memenuhi daftar peran yang diizinkan (SUPERADMIN lolos cek ADMIN). */
export function roleAllowed(role: Role, roles?: Role[]) {
  if (!roles) return true;
  return roles.includes(role) || (role === "SUPERADMIN" && roles.includes("ADMIN"));
}

/** Lingkup data: null = semua OpCo; selain itu kode OpCo tunggal. */
export function opcoScope(user: Scoped): string | null {
  if (user.role !== "OPCO") return null;
  if (!user.opcoCode) throw new Error("Akun OpCo belum dihubungkan ke OpCo.");
  return user.opcoCode;
}

export function canSeeOpco(user: Scoped, code: string) {
  const scope = opcoScope(user);
  return scope === null || scope === code;
}

/** Halaman awal setelah login. */
export const homeFor = (role: Role) => (isAdmin(role) ? "/cms/monitoring" : role === "OPCO" ? "/cms/upload" : "/dashboard");
