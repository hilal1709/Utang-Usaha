"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import AOS from "aos";
import "aos/dist/aos.css";

/** AOS hanya untuk panel di bawah lipatan pertama; konten tetap terlihat tanpa JS. */
export function AosInit() {
  const pathname = usePathname();
  useEffect(() => {
    AOS.init({ once: true, duration: 520, easing: "ease-out-cubic", offset: 40, disable: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches });
  }, []);
  useEffect(() => { AOS.refreshHard(); }, [pathname]);
  return null;
}
