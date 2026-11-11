import { cn } from "@/lib/utils";
import { SIG_ASPECT, SIG_CHEVRON, SIG_LETTERS, SIG_VIEWBOX } from "@/components/brand/geometry";

/** Animasi loading logo SIG: chevron naik-turun, huruf terisi menyapu kiri → kanan. CSS murni; mati bila prefers-reduced-motion. */
export function SigLoader({ className }: { className?: string }) {
  return (
    <svg viewBox={SIG_VIEWBOX} className={cn("h-14 w-auto shrink-0", className)} style={{ aspectRatio: SIG_ASPECT }} aria-hidden>
      <path d={SIG_CHEVRON} fill="#F03340" className="sig-chevron" />
      <path d={SIG_LETTERS} fill="currentColor" opacity={0.22} />
      <path d={SIG_LETTERS} fill="currentColor" className="sig-letters" />
    </svg>
  );
}
