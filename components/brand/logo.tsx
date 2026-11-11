import { cn } from "@/lib/utils";
import { SIG_ASPECT, SIG_CHEVRON, SIG_LETTERS, SIG_VIEWBOX } from "./geometry";

// Logo SIG: chevron merah di atas huruf "SIG". Lihat design/logo/GUIDELINES.md.
const PALETTES = {
  color: { chevron: "#F03340", letters: "#0A0A0A" },
  onDark: { chevron: "#FF4D5A", letters: "#FFFFFF" },
  mono: { chevron: "currentColor", letters: "currentColor" },
} as const;

type Variant = keyof typeof PALETTES;

/** Logo SIG (chevron + huruf). Lebar mengikuti tinggi (rasio ≈ 1.72:1). */
export function BrandMark({ variant = "color", className, title = "SIG", ink }: { variant?: Variant; small?: boolean; className?: string; title?: string; ink?: string }) {
  const c = PALETTES[variant];
  return (
    <svg viewBox={SIG_VIEWBOX} className={cn("h-8 w-auto shrink-0", className)} style={{ aspectRatio: SIG_ASPECT }} role="img" aria-label={title}>
      <path d={SIG_CHEVRON} fill={c.chevron} />
      <path d={SIG_LETTERS} fill={ink ?? c.letters} />
    </svg>
  );
}

export function BrandLockup({ variant = "color", ink, className, sub }: { variant?: Variant; ink?: string; className?: string; sub?: string }) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <BrandMark variant={variant} ink={ink} className="h-9" />
      {sub && <span className="max-w-[11rem] border-l border-current/30 pl-3 text-[0.7rem] leading-tight font-medium opacity-75">{sub}</span>}
    </span>
  );
}
