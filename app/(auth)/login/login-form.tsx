"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { CardSpotlight } from "@/components/aceternity/card-spotlight";
import { Banner } from "@/components/feedback/banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const [show, setShow] = useState(false);
  return (
    <CardSpotlight className="glass rounded-2xl p-7 sm:p-8">
      <h2 className="text-[1.45rem] font-semibold tracking-[-0.02em] text-ink">Masuk</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Gunakan akun yang diberikan Treasury untuk OpCo Anda.</p>

      <form action={action} className="mt-7 space-y-5">
        {state.error && <Banner tone="danger" title="Gagal masuk">{state.error}</Banner>}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="username" required defaultValue={state.email}
            placeholder="nama@perusahaan.co.id" className="h-11 glass-input" aria-invalid={!!state.error || undefined} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Kata sandi</Label>
          <div className="relative">
            <Input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required
              className="h-11 glass-input pr-11" aria-invalid={!!state.error || undefined} />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted-foreground hover:text-ink">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" disabled={pending} className="h-11 w-full text-[0.95rem]">
          {pending ? <><LoaderCircle className="animate-spin" /> Memeriksa…</> : "Masuk"}
        </Button>
      </form>
      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">Lupa kata sandi? Hubungi admin Treasury untuk mengatur ulang akun Anda.</p>
    </CardSpotlight>
  );
}
