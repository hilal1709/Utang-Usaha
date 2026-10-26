"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error?: string; email?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  try {
    await signIn("credentials", { email, password: formData.get("password"), redirectTo: "/cms" });
    return {};
  } catch (e) {
    if (e instanceof CredentialsSignin && e.code === "inactive") return { error: "Akun ini dinonaktifkan. Hubungi Superadmin.", email };
    if (e instanceof AuthError) return { error: "Email atau kata sandi tidak cocok. Periksa lalu coba lagi.", email };
    throw e; // redirect sukses dilempar sebagai error khusus Next
  }
}
