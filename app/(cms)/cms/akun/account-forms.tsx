"use client";

import { useState, useTransition } from "react";
import { KeyRound, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/feedback/toaster";
import { changeOwnPassword, updateOwnProfile } from "../actions";

export function ProfileForm({ name: initial }: { name: string }) {
  const [name, setName] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-wrap items-end gap-3 border-t border-border pt-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await updateOwnProfile({ name });
          if (r.ok) toast.success(r.message); else toast.error(r.message);
        });
      }}
    >
      <div className="min-w-[14rem] flex-1 space-y-1.5">
        <Label htmlFor="a-name">Nama tampilan</Label>
        <Input id="a-name" value={name} onChange={(e) => setName(e.target.value)} className="h-9 glass-input" required minLength={2} maxLength={80} />
      </div>
      <Button type="submit" variant="outline" disabled={pending || name.trim() === initial}><Save /> Simpan nama</Button>
    </form>
  );
}

export function PasswordForm() {
  const empty = { current: "", next: "", confirm: "" };
  const [f, setF] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const mismatch = f.confirm.length > 0 && f.confirm !== f.next;
  return (
    <form
      className="mt-5 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await changeOwnPassword(f);
          if (!r.ok) return void setError(r.message);
          setError(null);
          setF(empty);
          toast.success(r.message);
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="p-current">Kata sandi saat ini</Label>
        <Input id="p-current" type="password" autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} className="h-9 glass-input" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="p-next">Kata sandi baru</Label>
          <Input id="p-next" type="password" autoComplete="new-password" minLength={10} value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} className="h-9 glass-input" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-confirm">Ulangi kata sandi baru</Label>
          <Input id="p-confirm" type="password" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} className="h-9 glass-input" required aria-invalid={mismatch || undefined} aria-describedby="p-msg" />
        </div>
      </div>
      <p id="p-msg" role={error ? "alert" : undefined} className="min-h-5 text-sm text-ink">
        {error ?? (mismatch ? "Belum sama dengan kata sandi baru." : "")}
      </p>
      <Button type="submit" disabled={pending || mismatch}><KeyRound /> Ganti kata sandi</Button>
    </form>
  );
}
