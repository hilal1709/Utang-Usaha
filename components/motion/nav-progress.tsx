"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Phase = "idle" | "loading" | "done";

/** Garis progres tipis di atas layar: muncul begitu tautan internal diklik, selesai saat rute baru tampil. */
export function NavProgress() {
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<number[]>([]);

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target && a.target !== "_self" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      clear();
      setPhase("loading");
      // Jaring pengaman bila navigasi dibatalkan atau gagal.
      timers.current.push(window.setTimeout(() => setPhase("idle"), 15000));
    };
    document.addEventListener("click", onClick, true);
    return () => { document.removeEventListener("click", onClick, true); clear(); };
  }, []);

  const finish = () => {
    clear();
    setPhase((p) => (p === "loading" ? "done" : p));
    timers.current.push(window.setTimeout(() => setPhase("idle"), 420));
  };

  return (
    <>
      <Suspense fallback={null}><RouteWatcher onChange={finish} /></Suspense>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]"
        style={{ opacity: phase === "idle" ? 0 : 1, transition: `opacity ${phase === "done" ? 320 : 120}ms ease-out ${phase === "done" ? 160 : 0}ms` }}
      >
        {phase !== "idle" && (
          <div
            className="nav-progress-bar h-full origin-left"
            data-phase={phase}
          />
        )}
      </div>
    </>
  );
}

function RouteWatcher({ onChange }: { onChange: () => void }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const first = useRef(true);
  const cb = useRef(onChange);
  useEffect(() => { cb.current = onChange; });
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    cb.current();
  }, [pathname, search]);
  return null;
}
