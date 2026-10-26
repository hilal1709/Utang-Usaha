import { signOut } from "@/auth";

/** Dipakai saat sesi JWT masih ada tetapi akun sudah dinonaktifkan/dihapus. */
export async function GET() {
  await signOut({ redirectTo: "/login" });
}
