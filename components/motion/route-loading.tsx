import { Lottie } from "@/components/motion/lottie";

/** Animasi loading bermerek saat pindah halaman: lapisan umur terisi + kerangka panel. */
export function RouteLoading({ label = "Memuat data…" }: { label?: string }) {
  return (
    <div className="px-4 pt-8 pb-12 sm:px-8" role="status" aria-live="polite">
      <div className="flex items-center gap-4">
        <Lottie name="loader" className="h-14 w-16" />
        <div>
          <p className="text-sm font-semibold text-ink">{label}</p>
          <p className="text-xs text-ink-soft">Menghitung ulang dari data aktif terbaru</p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden>
        {["bg-[#3b8ea5]/25", "bg-[#f5ee9e]/60", "bg-[#f49e4c]/30", "bg-[#ab3428]/20"].map((c) => (
          <div key={c} className={`h-[132px] animate-pulse rounded-2xl ${c}`} />
        ))}
      </div>
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3" aria-hidden>
        <div className="glass-solid h-[320px] animate-pulse rounded-2xl xl:col-span-2" />
        <div className="glass-solid h-[320px] animate-pulse rounded-2xl" />
      </div>
    </div>
  );
}
