"use client";

import { useEffect, useState } from "react";
import { LottieLight } from "lottie-react";

export type LottieName = "loader" | "upload-success" | "upload-error" | "empty";

const cache = new Map<string, Promise<object>>();
const load = (name: LottieName) => {
  if (!cache.has(name)) cache.set(name, fetch(`/lottie/${name}.json`).then((r) => r.json()));
  return cache.get(name)!;
};
// Loader dipanaskan sejak awal agar tidak kosong saat halaman loading pertama tampil.
if (typeof window !== "undefined") load("loader").catch(() => cache.delete("loader"));

/** Ilustrasi Lottie bermerek dari /public/lottie (dibuat oleh scripts/gen-lottie.py). Diam bila reduced-motion. */
export function Lottie({ name, className, loop = true, label }: { name: LottieName; className?: string; loop?: boolean; label?: string }) {
  const [data, setData] = useState<object | null>(null);
  // Hanya dipakai setelah data dimuat di klien, jadi tidak memengaruhi HTML server.
  const [reduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    let alive = true;
    load(name).then((d) => alive && setData(d));
    return () => { alive = false; };
  }, [name]);
  return (
    <div className={className} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {data && <LottieLight src={data as never} autoplay={!reduced} loop={reduced ? false : loop} className="size-full" />}
    </div>
  );
}
