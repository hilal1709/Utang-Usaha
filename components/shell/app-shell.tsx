"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn, LogOut, Menu } from "lucide-react";
import { BrandLockup } from "@/components/brand/logo";
import { LordIcon, type LordName } from "@/components/motion/lord-icon";
import { NavProgress } from "@/components/motion/nav-progress";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ROLE_LABEL } from "@/lib/access";
import { logout } from "./logout-action";

export type NavItem = { href: string; label: string; icon: LordName; exact?: boolean };
export type NavGroup = { title?: string; items: NavItem[] };

type Props = {
  theme: "dash" | "cms";
  groups: NavGroup[];
  user: { name: string; role: string; opcoCode: string | null } | null;
  sub: string;
  children: React.ReactNode;
};


function Rail({ theme, groups, user, sub, onNavigate }: Omit<Props, "children"> & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (i: NavItem) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + "/"));
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-rail text-rail-ink shadow-[0_24px_48px_-24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.45)] ring-1 ring-white/30 backdrop-blur-2xl backdrop-saturate-150 max-lg:rounded-none">
      <div className="px-5 pt-6 pb-7">
        <BrandLockup variant={theme === "cms" ? "color" : "onDark"} ink="var(--brand-ink)" sub={sub} />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 scroll-thin" aria-label="Navigasi utama">
        {groups.map((g, gi) => (
          <div key={gi}>
            {g.title && <p className="px-3 pb-2 text-[0.7rem] font-semibold text-rail-muted">{g.title}</p>}
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const active = isActive(item);
                const id = `nav-${item.href.replace(/\W/g, "-")}`;
                return (
                  <li key={item.href}>
                    <Link
                      id={id}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-[0.9rem] font-medium transition-colors duration-150",
                        active ? "bg-[var(--rail-active-bg)] text-[var(--rail-active-ink)] shadow-[0_8px_18px_-10px_rgba(0,0,0,0.45)]" : "text-rail-ink/90 hover:bg-[color-mix(in_oklab,var(--rail-ink)_10%,transparent)]",
                      )}
                    >
                      <LordIcon name={item.icon} size={22} target={`#${id}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-[color-mix(in_oklab,var(--rail-ink)_14%,transparent)] p-3">
        {!user ? (
          <Link href="/login" onClick={onNavigate} className="flex items-center justify-center gap-2 rounded-full bg-[var(--action)] px-3 py-2.5 text-sm font-semibold text-[var(--action-ink)] shadow-[0_10px_20px_-12px_rgba(0,0,0,0.5)] hover:brightness-105">
            <LogIn className="size-4" /> Masuk ke CMS
          </Link>
        ) : (
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="grid size-8 place-items-center rounded-full bg-[color-mix(in_oklab,var(--rail-ink)_14%,transparent)] text-xs font-semibold">
            {user.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </span>
          <Link href="/cms/akun" onClick={onNavigate} className="min-w-0 flex-1 rounded-md leading-tight hover:underline hover:underline-offset-4" title="Akun saya">
            <span className="block truncate text-sm font-medium">{user.name}</span>
            <span className="block truncate text-[0.72rem] text-rail-muted">{ROLE_LABEL[user.role as keyof typeof ROLE_LABEL] ?? user.role}{user.opcoCode ? ` · ${user.opcoCode}` : ""}</span>
          </Link>
          <form action={logout}>
            <button type="submit" className="grid size-8 place-items-center rounded-md text-rail-muted hover:bg-[color-mix(in_oklab,var(--rail-ink)_10%,transparent)] hover:text-rail-ink" aria-label="Keluar" title="Keluar">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
        )}
        <p className="px-3 pt-1 text-[0.65rem] text-rail-muted/80">
          Ikon animasi oleh <a className="underline" href="https://lordicon.com" target="_blank" rel="noreferrer">Lordicon</a>
        </p>
      </div>
    </div>
  );
}

export function AppShell({ theme, groups, user, sub, children }: Props) {
  const [open, setOpen] = useState(false);
  // Toast, modal, sheet, dan popup select dirender di <body> (portal), di luar div bertema ini;
  // tema disalin ke <html> agar elemen-elemen itu ikut tema halaman (dash/cms).
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    return () => { delete root.dataset.theme; };
  }, [theme]);
  return (
    <div data-theme={theme} className="ground-fields min-h-dvh text-foreground">
      <NavProgress />
      <aside className="fixed inset-y-3 left-3 z-30 hidden w-[244px] lg:block">
        <Rail theme={theme} groups={groups} user={user} sub={sub} />
      </aside>
      <div className="min-w-0 overflow-x-clip lg:pl-[264px]">
        <div className="glass sticky top-0 z-20 flex items-center gap-3 px-4 py-2.5 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="glass-pill grid size-9 place-items-center rounded-full" aria-label="Buka menu">
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[270px] border-0 bg-transparent p-0 shadow-none" data-theme={theme}>
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Rail theme={theme} groups={groups} user={user} sub={sub} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <BrandLockup variant={theme === "cms" ? "onDark" : "onDark"} ink="#ffffff" />
        </div>
        {children}
      </div>
    </div>
  );
}
