import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { opcos, users } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/access";
import { PageHeader } from "@/components/shell/page-header";
import { relTime } from "@/lib/format";
import { PasswordForm, ProfileForm } from "./account-forms";

export const metadata: Metadata = { title: "Akun saya" };

export default async function AccountPage() {
  const me = await requireUser();
  const [[row], [opco]] = await Promise.all([
    db.select({ lastLoginAt: users.lastLoginAt, createdAt: users.createdAt }).from(users).where(eq(users.id, me.id)),
    me.opcoCode ? db.select({ name: opcos.name }).from(opcos).where(eq(opcos.code, me.opcoCode)) : Promise.resolve([undefined]),
  ]);
  const scope = me.role === "OPCO" ? `${me.opcoCode}${opco ? ` — ${opco.name}` : ""}` : "Semua OpCo";
  return (
    <>
      <PageHeader title="Akun saya" description="Ubah nama tampilan dan kata sandi. Peran dan OpCo hanya bisa diubah oleh Superadmin." />
      <div className="grid gap-6 px-4 pb-14 sm:px-8 xl:grid-cols-2">
        <section className="glass-solid space-y-5 rounded-2xl p-5" aria-labelledby="profil-title">
          <h2 id="profil-title" className="font-semibold text-ink">Profil</h2>
          <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">
            <dt className="text-ink-soft">Email</dt><dd className="truncate text-ink">{me.email}</dd>
            <dt className="text-ink-soft">Peran</dt><dd className="text-ink">{ROLE_LABEL[me.role]}</dd>
            <dt className="text-ink-soft">Lingkup data</dt><dd className="text-ink">{scope}</dd>
            <dt className="text-ink-soft">Login terakhir</dt><dd className="text-ink">{row?.lastLoginAt ? relTime(row.lastLoginAt) : "–"}</dd>
          </dl>
          <ProfileForm name={me.name} />
        </section>
        <section className="glass-solid rounded-2xl p-5" aria-labelledby="sandi-title">
          <h2 id="sandi-title" className="font-semibold text-ink">Ganti kata sandi</h2>
          <p className="mt-1 text-sm text-ink-soft">Minimal 10 karakter. Ganti segera bila Anda masih memakai kata sandi sementara dari Superadmin.</p>
          <PasswordForm />
        </section>
      </div>
    </>
  );
}
