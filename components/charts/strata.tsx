"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { BUCKETS, type Bucket } from "@/lib/rules/constants";
import { milyarAuto, share } from "@/lib/format";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

export const BUCKET_STYLE: Record<Bucket, { color: string; ink: string; short: string }> = {
  "Belum Jatuh Tempo": { color: "#e9e08a", ink: "#3d3a12", short: "Belum JT" },
  "1-45 hari": { color: "#f4c06a", ink: "#4a300c", short: "1–45" },
  "46-135 hari": { color: "#f49e4c", ink: "#4a2508", short: "46–135" },
  "136-365 hari": { color: "#d0663a", ink: "#fff", short: "136–365" },
  "> 365 hari": { color: "#ab3428", ink: "#fff", short: "> 365" },
};

/**
 * Elemen khas AP Insight: "core sample" umur utang. Satu batang = satu saldo,
 * dipotong per bucket dari segar (kiri) ke paling tua (kanan, Brick Red).
 */
export function StrataBar({ buckets, total, height = 14, className, animate = true, label }: {
  buckets: Record<Bucket, number>; total?: number; height?: number; className?: string; animate?: boolean; label?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const sum = total ?? BUCKETS.reduce((s, b) => s + Math.max(0, buckets[b] ?? 0), 0);
  useGSAP(() => {
    if (!animate) return;
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(root.current!.querySelectorAll("[data-seg]"), { scaleX: 0, transformOrigin: "0% 50%", duration: 0.9, ease: "expo.out", stagger: 0.05 });
    });
  }, { scope: root, dependencies: [sum] });
  const desc = BUCKETS.filter((b) => buckets[b] > 0).map((b) => `${b} Rp ${milyarAuto(buckets[b])} M`).join(", ");
  return (
    <div ref={root} role="img" aria-label={`${label ? label + ": " : ""}${desc || "tidak ada saldo"}`}
      className={cn("flex w-full gap-[2px] overflow-hidden rounded-[6px] bg-[var(--track)]", className)} style={{ height }}>
      {sum > 0 && BUCKETS.map((b) => {
        const v = Math.max(0, buckets[b] ?? 0);
        if (!v) return null;
        return <span key={b} data-seg title={`${b}: Rp ${milyarAuto(v)} M (${share(v, sum)})`} style={{ width: `${(v / sum) * 100}%`, background: BUCKET_STYLE[b].color }} className="h-full min-w-[2px]" />;
      })}
    </div>
  );
}

/** Legenda + rincian bucket berurutan dari segar ke tua. */
export function StrataLegend({ buckets, compact = false }: { buckets: Record<Bucket, number>; compact?: boolean }) {
  const sum = BUCKETS.reduce((s, b) => s + Math.max(0, buckets[b] ?? 0), 0);
  return (
    <dl className={cn("grid gap-x-5 gap-y-2.5", compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-6")}>
      {BUCKETS.map((b) => (
        <div key={b} className="min-w-0">
          <dt className="flex items-center gap-1.5 text-[0.72rem] font-medium text-ink-soft">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: BUCKET_STYLE[b].color }} />
            <span className="truncate">{b}</span>
          </dt>
          <dd className="num mt-0.5 text-sm font-semibold text-ink">
            {milyarAuto(buckets[b] ?? 0)} <span className="text-[0.7rem] font-medium text-ink-soft">{share(buckets[b] ?? 0, sum)}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
