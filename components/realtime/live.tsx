"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/feedback/toaster";
import { cn } from "@/lib/utils";

export type LiveEvent = { id: number; kind: string; message: string; period: string | null; opcoCode: string | null; at: string };
type LiveState = { status: "connecting" | "live" | "offline"; last: LiveEvent | null; subscribe: (fn: (e: LiveEvent) => void) => () => void };

const LiveContext = createContext<LiveState>({ status: "offline", last: null, subscribe: () => () => {} });
export const useLive = () => useContext(LiveContext);

/**
 * Berlangganan /api/stream (SSE). Saat data OpCo aktif berubah, halaman server di-refresh
 * sehingga angka dashboard ikut berganti tanpa muat ulang.
 */
export function LiveProvider({ children, refreshOn = ["data_updated"], notify = true }: { children: React.ReactNode; refreshOn?: string[]; notify?: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<LiveState["status"]>("connecting");
  const [last, setLast] = useState<LiveEvent | null>(null);
  const subs = useRef(new Set<(e: LiveEvent) => void>());
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/stream");
    const kinds = ["data_updated", "upload_started", "upload_rejected", "period_locked", "period_opened", "master_updated"];
    const onEvent = (ev: MessageEvent) => {
      const e = JSON.parse(ev.data) as LiveEvent;
      setLast(e);
      subs.current.forEach((fn) => fn(e));
      if (refreshOn.includes(e.kind)) {
        if (notify) toast.info("Data diperbarui", { description: e.message });
        if (refreshTimer.current) clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => router.refresh(), 400);
      }
    };
    kinds.forEach((k) => es.addEventListener(k, onEvent as EventListener));
    es.onopen = () => setStatus("live");
    es.onerror = () => setStatus(es.readyState === EventSource.CLOSED ? "offline" : "connecting");
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subscribe = useCallback((fn: (e: LiveEvent) => void) => {
    subs.current.add(fn);
    return () => { subs.current.delete(fn); };
  }, []);
  const value = useMemo(() => ({ status, last, subscribe }), [status, last, subscribe]);
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

const noopSubscribe = () => () => {};

export function LiveBadge({ className }: { className?: string }) {
  const live = useLive();
  // Status koneksi hanya ada di browser; render server selalu "menyambung" agar hidrasi cocok.
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const status = isClient ? live.status : "connecting";
  const label = status === "live" ? "Realtime" : status === "connecting" ? "Menyambung…" : "Terputus";
  return (
    <span className={cn("inline-flex items-center gap-2 glass-pill rounded-full px-3 py-1.5 text-xs font-medium", className)} title="Status pembaruan otomatis">
      <span className="relative flex size-2">
        {status === "live" && <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#f5ee9e] opacity-70" />}
        <span className={cn("relative inline-flex size-2 rounded-full", status === "live" ? "bg-[#f5ee9e]" : status === "connecting" ? "bg-[#f49e4c]" : "bg-[#ff8f80]")} />
      </span>
      {label}
    </span>
  );
}
