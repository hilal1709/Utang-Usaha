"use client";

import { LordIcon as LordIconBase } from "@lordicon/react";

export type LordName =
  | "home" | "suitcase" | "category" | "coins" | "layers" | "chart" | "document" | "edit-document"
  | "settings" | "avatar" | "check" | "search" | "display";

/**
 * Ikon Lordicon keluarga "wired outline". Diputar saat elemen `target` (mis. link navigasi) di-hover;
 * warnanya mengikuti `color` teks sehingga ikut tema. Gerak otomatis dihormati oleh elemen (reduced-motion).
 */
export function LordIcon({ name, size = 22, target, trigger = "hover" }: { name: LordName; size?: number; target?: string; trigger?: string }) {
  return (
    <LordIconBase
      src={`/lordicon/${name}.json`}
      trigger={trigger}
      target={target}
      currentColor
      loading="lazy"
      aria-hidden
      style={{ width: size, height: size, flexShrink: 0, display: "inline-block" }}
    >
      <span style={{ width: size, height: size, display: "inline-block" }} />
    </LordIconBase>
  );
}
