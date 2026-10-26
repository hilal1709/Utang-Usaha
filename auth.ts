import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { db } from "@/db";
import { users } from "@/db/schema";

class InactiveAccount extends CredentialsSignin {
  code = "inactive";
}

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) throw new CredentialsSignin();
        const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
        if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) throw new CredentialsSignin();
        if (!user.active) throw new InactiveAccount();
        await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
        return { id: user.id, name: user.name, email: user.email, role: user.role, opcoCode: user.opcoCode };
      },
    }),
  ],
});
