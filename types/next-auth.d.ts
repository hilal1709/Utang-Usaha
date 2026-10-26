import type { DefaultSession } from "next-auth";
import type { Role } from "@/auth.config";

declare module "next-auth" {
  interface User {
    role: Role;
    opcoCode: string | null;
  }
  interface Session {
    user: { id: string; role: Role; opcoCode: string | null } & DefaultSession["user"];
  }
}
