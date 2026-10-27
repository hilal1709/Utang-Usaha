"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

/** Nada tile kaca: dashboard (Cyan/Vanilla/Sandy/Brick) dan CMS (Light Blue/Cool Steel/Ebony/Golden). */
const TONES = {
  cyan: "[--tile:#3b8ea5] text-white [--sub:rgba(255,255,255,0.86)]",
  vanilla: "[--tile:#f5ee9e] text-[#2f2c0c] [--sub:#55501a]",
  sandy: "[--tile:#f49e4c] text-[#311803] [--sub:#56300c]",
  brick: "[--tile:#ab3428] text-white [--sub:rgba(255,255,255,0.86)]",
  lightblue: "[--tile:#9ac2c9] text-[#16302f] [--sub:#2c4a4d]",
  steel: "[--tile:#8aa1b1] text-[#16222b] [--sub:#2d3d48]",
  ebony: "[--tile:#4a5043] text-white [--sub:rgba(255,255,255,0.82)]",
  pollen: "[--tile:#ffcb47] text-[#2a2208] [--sub:#4f3f0f]",
} as const;
export type Tone = keyof typeof TONES;

/** Angka yang dihitung naik sekali saat tampil (GSAP). `unit="M"` = Milyar Rupiah, `unit="count"` = bilangan. */
export function CountUp({ value, digits = 0, unit = "M", className }: { value: number; digits?: number; unit?: "M" | "count"; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = (n: number) => (unit === "M" ? n / 1e9 : n).toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  useGSAP(() => {
    const el = ref.current!;
    el.textContent = fmt(value);
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      const o = { v: 0 };
      gsap.to(o, { v: value, duration: 1.1, ease: "expo.out", onUpdate: () => { el.textContent = fmt(o.v); }, onComplete: () => { el.textContent = fmt(value); } });
    });
  }, { dependencies: [value] });
  return <span ref={ref} className={cn("num", className)}>{fmt(value)}</span>;
}

export function KpiTile({ tone, label, value, digits = 0, unit = "M", suffix, note, delta, deltaLabel }: {
  tone: Tone; label: string; value: number; digits?: number; unit?: "M" | "count"; suffix?: string; note?: React.ReactNode; delta?: number | null; deltaLabel?: string;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className={cn("glass-tile flex min-h-[124px] min-w-0 flex-col justify-between rounded-[1.6rem] p-4 sm:min-h-[136px] sm:p-5", TONES[tone])}>
      <p className="text-[0.82rem] font-semibold">{label}</p>
      <div>
        <p className="mt-3 flex items-baseline gap-1.5 leading-none">
          {unit === "M" && <span className="text-[0.95rem] font-semibold">Rp</span>}
          <CountUp value={value} digits={digits} unit={unit} className="text-[1.85rem] font-semibold tracking-[-0.03em] min-[400px]:text-[2.1rem] sm:text-[2.3rem]" />
          {unit === "M" ? <span className="text-[0.95rem] font-semibold">M</span> : suffix && <span className="text-[0.95rem] font-semibold">{suffix}</span>}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.75rem] text-[var(--sub)]">
          {delta != null && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-white/25 px-1.5 py-0.5 font-semibold">
              {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {(Math.abs(delta) * 100).toLocaleString("id-ID", { maximumFractionDigits: 2 })}%
            </span>
          )}
          {deltaLabel && <span>{deltaLabel}</span>}
          {note && <span className="min-w-0 break-words">{note}</span>}
        </div>
      </div>
    </div>
  );
}
