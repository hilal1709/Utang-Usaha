import { cn } from "@/lib/utils";
import { MARK_FULL, MARK_REVERSED, MARK_SMALL, WORDMARK } from "./geometry";

// "Core Lens": lingkaran dipotong lapisan yang menebal ke bawah (umur utang). Lihat design/logo/GUIDELINES.md.
const PALETTES = {
  color: ["#3B8EA5", "#F5EE9E", "#F49E4C", "#AB3428"],
  onDark: ["#FFFFFF", "#F5EE9E", "#F49E4C", "#E2604F"],
  mono: ["currentColor", "currentColor", "currentColor", "currentColor"],
} as const;
const SMALL_COLORS = { color: ["#3B8EA5", "#F49E4C", "#AB3428"], onDark: ["#FFFFFF", "#F49E4C", "#E2604F"], mono: ["currentColor", "currentColor", "currentColor"] } as const;

type Variant = keyof typeof PALETTES;

/** Simbol logo. `small` memakai potongan 3 lapisan untuk ukuran ≤ 24 px. */
export function BrandMark({ variant = "color", small = false, className, title = "AP Insight" }: { variant?: Variant; small?: boolean; className?: string; title?: string }) {
  const bands = small ? MARK_SMALL : variant === "onDark" ? MARK_REVERSED : MARK_FULL;
  const colors = small ? SMALL_COLORS[variant] : PALETTES[variant];
  return (
    <svg viewBox="24 24 208 208" className={cn("size-8 shrink-0", className)} role="img" aria-label={title}>
      {bands.map((d, i) => <path key={i} d={d} fill={colors[i]} />)}
    </svg>
  );
}

/** Wordmark "AP Insight" sebagai kurva (Geist SemiBold), titik i persegi Sandy. */
export function Wordmark({ className, color = "currentColor", dot = "#F49E4C" }: { className?: string; color?: string; dot?: string }) {
  const { viewBox, transform, d, dot: r } = WORDMARK;
  return (
    <svg viewBox={viewBox} className={cn("h-[1.05rem] w-auto", className)} role="img" aria-label="AP Insight">
      <g transform={transform}>
        <path d={d} fill={color} />
        <rect x={r.x} y={r.y} width={r.size} height={r.size} rx={r.rx} fill={dot} />
      </g>
    </svg>
  );
}

export function BrandLockup({ variant = "color", ink, className, sub }: { variant?: Variant; ink?: string; className?: string; sub?: string }) {
  const onDark = variant === "onDark";
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark variant={variant} className="size-8" />
      <span className="flex flex-col leading-none">
        <Wordmark color={ink ?? (onDark ? "#FFFFFF" : "#12303D")} className="h-[1.1rem]" />
        {sub && <span className="mt-1.5 text-[0.7rem] font-medium opacity-75">{sub}</span>}
      </span>
    </span>
  );
}
