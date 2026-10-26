import type { NextAuthConfig } from "next-auth";
import { homeFor } from "@/lib/access";

export type Role = "SUPERADMIN" | "ADMIN" | "OPCO" | "VIEWER";

/** Konfigurasi ringan tanpa akses DB — dipakai juga oleh proxy.ts. */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 10 },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const role = auth?.user?.role;
      const path = nextUrl.pathname;
      const admin = role === "ADMIN" || role === "SUPERADMIN";
      if (path.startsWith("/login")) {
        if (role) return Response.redirect(new URL(homeFor(role), nextUrl));
        return true;
      }
      // Seluruh aplikasi (dashboard & CMS) wajib login; lingkup data OpCo ditegakkan di server.
      if (!role) return false;
      if (path.startsWith("/cms/users")) {
        return role === "SUPERADMIN" ? true : Response.redirect(new URL("/cms", nextUrl));
      }
      if (path.startsWith("/cms/monitoring") || path.startsWith("/cms/master")) {
        return admin ? true : Response.redirect(new URL("/cms", nextUrl));
      }
      if (path.startsWith("/cms/upload") && role === "VIEWER") return Response.redirect(new URL("/dashboard", nextUrl));
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.opcoCode = user.opcoCode ?? null;
        token.uid = user.id;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role as Role;
      session.user.opcoCode = (token.opcoCode as string | null) ?? null;
      session.user.id = token.uid as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
