"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

// Lapisan umur tanpa angka (halaman sebelum login tidak boleh menampilkan data).
const LAYERS = [
  { label: "Belum jatuh tempo", w: 0.92, h: 22, c: "#f5ee9e" },
  { label: "1–45 hari", w: 0.7, h: 26, c: "#f4c06a" },
  { label: "46–135 hari", w: 0.52, h: 30, c: "#f49e4c" },
  { label: "136–365 hari", w: 0.38, h: 34, c: "#d0663a" },
  { label: "> 365 hari", w: 0.3, h: 40, c: "#ab3428" },
];

/** Momen gerak utama halaman login: lapisan umur turun dan mengendap satu per satu. */
export function StrataHero() {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".stratum", { scaleX: 0, transformOrigin: "0% 50%", duration: 1.1, ease: "expo.out", stagger: 0.12, delay: 0.2 });
        gsap.from(".stratum-label", { opacity: 0, x: -8, duration: 0.6, ease: "expo.out", stagger: 0.12, delay: 0.55 });
      });
    },
    { scope: root },
  );
  return (
    <div ref={root} className="space-y-1.5" aria-hidden>
      {LAYERS.map((l) => (
        <div key={l.label} className="flex items-center gap-3">
          <div className="stratum rounded-[6px] shadow-[0_8px_20px_-12px_rgba(0,0,0,0.5)]" style={{ width: `${l.w * 100}%`, height: l.h, background: l.c }} />
          <span className="stratum-label whitespace-nowrap text-xs font-medium text-white/80">{l.label}</span>
        </div>
      ))}
    </div>
  );
}
