"use client";

import { useMemo, useState, useTransition } from "react";
import { Copy, KeyRound, Pencil, Power, Search, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemedSelect } from "@/components/ui/themed-select";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/feedback/toaster";
import { ROLE_LABEL } from "@/lib/access";
import { relTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Role } from "@/auth.config";
import { createUser, deleteUser, resetPassword, setUserActive, updateUser } from "../actions";

type Row = { id: string; name: string; email: string; role: Role; opcoCode: string | null; active: boolean; lastLoginAt: string | null; createdAt: string };
type Opco = { code: string; name: string };

const ROLE_HINT: Record<Role, string> = {
  OPCO: "OpCo — unggah & lihat data OpCo sendiri",
  VIEWER: "Pimpinan — lihat & ekspor semua OpCo",
  ADMIN: "Admin Treasury — monitoring & master data",
  SUPERADMIN: "Superadmin — semua hak + kelola akun",
};
const ROLE_ORDER: Role[] = ["OPCO", "VIEWER", "ADMIN", "SUPERADMIN"];
const selectCls = "w-full";

function RoleFields({ role, opcoCode, opcos, idPrefix, onChange }: {
  role: Role; opcoCode: string; opcos: Opco[]; idPrefix: string; onChange: (v: { role: Role; opcoCode: string }) => void;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-role`}>Peran</Label>
        <ThemedSelect id={`${idPrefix}-role`} value={role} onChange={(v) => onChange({ role: v as Role, opcoCode })} className={selectCls}
          options={ROLE_ORDER.map((r) => ({ value: r, label: ROLE_HINT[r] }))} />
      </div>
      {role === "OPCO" && (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-opco`}>OpCo</Label>
          <ThemedSelect id={`${idPrefix}-opco`} value={opcoCode} onChange={(v) => onChange({ role, opcoCode: v })} className={selectCls}
            options={opcos.map((o) => ({ value: o.code, label: `${o.code} — ${o.name}` }))} />
        </div>
      )}
    </>
  );
}

export function UserManager({ rows, opcos, me }: { rows: Row[]; opcos: Opco[]; me: string }) {
  const [form, setForm] = useState({ name: "", email: "", role: "OPCO" as Role, opcoCode: opcos[0]?.code ?? "" });
  const [secret, setSecret] = useState<{ email: string; pw: string } | null>(null);
  const [confirmDel, setConfirmDel] = useState<Row | null>(null);
  const [edit, setEdit] = useState<{ row: Row; name: string; role: Role; opcoCode: string } | null>(null);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [pending, start] = useTransition();

  const opcoWithoutAccount = useMemo(() => {
    const have = new Set(rows.filter((r) => r.role === "OPCO" && r.active).map((r) => r.opcoCode));
    return opcos.filter((o) => !have.has(o.code));
  }, [rows, opcos]);

  const visible = rows.filter((r) => {
    if (roleFilter && r.role !== roleFilter) return false;
    const t = q.trim().toLowerCase();
    return !t || r.name.toLowerCase().includes(t) || r.email.includes(t) || (r.opcoCode ?? "").toLowerCase().includes(t);
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await createUser({ ...form, opcoCode: form.role === "OPCO" ? form.opcoCode : null });
      if (!r.ok) return void toast.error(r.message);
      toast.success(r.message);
      if (r.secret) setSecret({ email: form.email, pw: r.secret });
      setForm({ ...form, name: "", email: "" });
    });
  };

  const saveEdit = () => edit && start(async () => {
    const r = await updateUser({ id: edit.row.id, name: edit.name, role: edit.role, opcoCode: edit.role === "OPCO" ? edit.opcoCode : null });
    if (!r.ok) return void toast.error(r.message);
    toast.success(r.message);
    setEdit(null);
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
      <div className="h-fit space-y-4">
        <form onSubmit={submit} className="glass-solid space-y-4 rounded-2xl p-5" aria-label="Tambah akun">
          <h2 className="font-semibold text-ink">Tambah akun</h2>
          <div className="space-y-1.5"><Label htmlFor="u-name">Nama</Label><Input id="u-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 glass-input" required /></div>
          <div className="space-y-1.5"><Label htmlFor="u-email">Email</Label><Input id="u-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9 glass-input" required /></div>
          <RoleFields idPrefix="u" role={form.role} opcoCode={form.opcoCode} opcos={opcos} onChange={(v) => setForm({ ...form, ...v })} />
          <Button type="submit" disabled={pending} className="w-full"><UserPlus /> Buat akun</Button>
        </form>
        {opcoWithoutAccount.length > 0 && (
          <p className="glass-solid rounded-2xl px-5 py-4 text-sm text-ink">
            <span className="font-medium">Belum punya akun OpCo aktif:</span>{" "}
            <span className="text-ink-soft">{opcoWithoutAccount.map((o) => o.code).join(", ")}</span>
          </p>
        )}
      </div>

      <section className="glass-solid min-w-0 rounded-2xl" aria-label="Daftar akun">
        <div className="flex flex-wrap items-center gap-2 px-5 pt-5 pb-3">
          <h2 className="mr-auto font-semibold text-ink">Akun <span className="num font-normal text-ink-soft">({rows.length})</span></h2>
          <label className="relative">
            <span className="sr-only">Cari akun</span>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, email, OpCo" className="h-9 w-56 pl-8 glass-input" />
          </label>
          <label>
            <span className="sr-only">Saring peran</span>
            <ThemedSelect value={roleFilter || "all"} onChange={(v) => setRoleFilter(v === "all" ? "" : (v as Role))} className="min-w-40"
              options={[{ value: "all", label: "Semua peran" }, ...ROLE_ORDER.map((r) => ({ value: r, label: ROLE_LABEL[r] }))]} />
          </label>
        </div>
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs text-ink-soft">
              <tr className="border-y border-border">
                <th className="px-5 py-3 font-medium">Nama</th><th className="px-3 py-3 font-medium">Peran</th><th className="px-3 py-3 font-medium">OpCo</th>
                <th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Login terakhir</th><th className="px-5 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((r) => (
                <tr key={r.id} className={cn("hover:bg-white/[0.07]", !r.active && "opacity-60")}>
                  <td className="px-5 py-3"><p className="font-medium text-ink">{r.name}{r.id === me && <span className="ml-1.5 text-xs font-normal text-ink-soft">(Anda)</span>}</p><p className="text-xs text-ink-soft">{r.email}</p></td>
                  <td className="px-3 py-3 text-ink">{ROLE_LABEL[r.role]}</td>
                  <td className="px-3 py-3 text-ink">{r.role === "OPCO" ? r.opcoCode : "Semua"}</td>
                  <td className="px-3 py-3">
                    <span className={cn("inline-flex items-center gap-1.5 text-ink", !r.active && "text-ink-soft")}>
                      <span className={cn("size-2 rounded-full", r.active ? "bg-[#b9d8c2]" : "bg-ink-soft/60")} aria-hidden />
                      {r.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-ink-soft">{r.lastLoginAt ? relTime(r.lastLoginAt) : "Belum pernah"}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <Button size="sm" variant="outline" disabled={pending} onClick={() => setEdit({ row: r, name: r.name, role: r.role, opcoCode: r.opcoCode ?? opcos[0]?.code ?? "" })}><Pencil /> Ubah</Button>
                      <Button size="icon-sm" variant="ghost" disabled={pending} aria-label={`Atur ulang sandi ${r.email}`} title="Atur ulang sandi" onClick={() => start(async () => {
                        const res = await resetPassword(r.id);
                        if (!res.ok) return void toast.error(res.message);
                        if (res.secret) setSecret({ email: r.email, pw: res.secret });
                      })}><KeyRound /></Button>
                      {r.id !== me && (
                        <>
                          <Button size="icon-sm" variant="ghost" disabled={pending} aria-label={`${r.active ? "Nonaktifkan" : "Aktifkan"} ${r.email}`} title={r.active ? "Nonaktifkan" : "Aktifkan"} onClick={() => start(async () => {
                            const res = await setUserActive(r.id, !r.active);
                            if (res.ok) toast.success(res.message); else toast.error(res.message);
                          })}><Power /></Button>
                          <Button size="icon-sm" variant="ghost" aria-label={`Hapus ${r.email}`} title="Hapus" onClick={() => setConfirmDel(r)}><Trash2 /></Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!visible.length && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-ink-soft">Tidak ada akun yang cocok dengan pencarian.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah hak akses</DialogTitle>
            <DialogDescription>{edit?.row.email} · perubahan berlaku pada halaman berikutnya yang dibuka pengguna.</DialogDescription>
          </DialogHeader>
          {edit && (
            <div className="space-y-4">
              <div className="space-y-1.5"><Label htmlFor="e-name">Nama</Label><Input id="e-name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="h-9 glass-input" /></div>
              <RoleFields idPrefix="e" role={edit.role} opcoCode={edit.opcoCode} opcos={opcos} onChange={(v) => setEdit({ ...edit, ...v })} />
            </div>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
            <Button disabled={pending} onClick={saveEdit}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!secret} onOpenChange={(o) => !o && setSecret(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kata sandi sementara</DialogTitle>
            <DialogDescription>Untuk {secret?.email}. Ditampilkan sekali ini saja — salin lalu kirim lewat kanal aman. Minta pengguna menggantinya di halaman Akun saya.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-3">
            <code className="flex-1 font-mono text-base tracking-wide text-ink">{secret?.pw}</code>
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(secret?.pw ?? ""); toast.success("Disalin"); }}><Copy /> Salin</Button>
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus akun {confirmDel?.email}?</DialogTitle>
            <DialogDescription>Pengguna tidak bisa masuk lagi. Riwayat unggahannya tetap tersimpan. Untuk menghentikan akses sementara, pakai Nonaktifkan.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
            <Button variant="destructive" disabled={pending} onClick={() => start(async () => {
              const r = await deleteUser(confirmDel!.id);
              if (r.ok) toast.success(r.message); else toast.error(r.message);
              setConfirmDel(null);
            })}>Hapus akun</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
