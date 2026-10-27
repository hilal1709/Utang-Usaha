"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Mousewheel, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StrataBar } from "@/components/charts/strata";
import type { Bucket } from "@/lib/rules/constants";
import { milyarAuto, share } from "@/lib/format";

export type OpcoCard = {
  code: string; name: string; total: number; tp: number; bumn: number; afiliasi: number; buckets: Record<Bucket, number>; cleanClear: number;
};

/** Carousel OpCo (urut total non-Interco). Geser, roda mouse, atau panah keyboard. */
export function OpcoCarousel({ cards, period }: { cards: OpcoCard[]; period: string }) {
  return (
    <div className="relative overflow-x-clip">
      <div className="mb-3 flex items-center justify-end gap-2 max-sm:hidden">
        <button className="opco-prev grid size-9 place-items-center glass-pill rounded-full disabled:opacity-40" aria-label="OpCo sebelumnya"><ChevronLeft className="size-4" /></button>
        <button className="opco-next grid size-9 place-items-center glass-pill rounded-full disabled:opacity-40" aria-label="OpCo berikutnya"><ChevronRight className="size-4" /></button>
      </div>
      <Swiper
        modules={[Navigation, Keyboard, Mousewheel, A11y]}
        navigation={{ prevEl: ".opco-prev", nextEl: ".opco-next" }}
        keyboard={{ enabled: true }}
        mousewheel={{ forceToAxis: true }}
        spaceBetween={12}
        slidesPerView={1.08}
        breakpoints={{ 480: { slidesPerView: 1.6, spaceBetween: 16 }, 640: { slidesPerView: 2.1, spaceBetween: 16 }, 1100: { slidesPerView: 3.1, spaceBetween: 16 }, 1500: { slidesPerView: 4.1, spaceBetween: 16 } }}
        a11y={{ prevSlideMessage: "OpCo sebelumnya", nextSlideMessage: "OpCo berikutnya" }}
        className="!overflow-visible"
      >
        {cards.map((c, i) => (
          <SwiperSlide key={c.code} className="!h-auto">
            <Link href={`/dashboard/opco/${c.code}?period=${period}`}
              className="glass-solid group flex h-full flex-col rounded-2xl p-5 transition-[transform,box-shadow] duration-200 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-white/[0.06]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink-soft">#{i + 1} · {c.code}</p>
                  <p className="mt-0.5 truncate font-semibold text-ink" title={c.name}>{c.name}</p>
                </div>
                <ChevronRight className="mt-1 size-4 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="num mt-4 text-[1.7rem] font-semibold leading-none tracking-[-0.03em] text-ink">
                {milyarAuto(c.total)}<span className="ml-1 text-sm font-medium text-ink-soft">M</span>
              </p>
              <StrataBar buckets={c.buckets} height={10} className="mt-4" animate={false} label={c.name} />
              <dl className="mt-4 grid grid-cols-3 gap-2 text-[0.72rem]">
                {[["Pihak Ketiga", c.tp], ["BUMN", c.bumn], ["Afiliasi", c.afiliasi]].map(([l, v]) => (
                  <div key={l as string}>
                    <dt className="text-ink-soft">{l}</dt>
                    <dd className="num mt-0.5 text-sm font-semibold text-ink">{milyarAuto(v as number)}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-auto pt-4 text-[0.72rem] text-ink-soft">Clean & Clear {share(c.cleanClear, c.total)}</p>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
