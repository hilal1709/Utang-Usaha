"use client";

import { Toaster, toast as sonner, type ExternalToast } from "sonner";
import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from "lucide-react";

/**
 * Toast bertema: kaca dengan garis status di tepi atas (bukan border kiri tebal),
 * judul tegas, deskripsi satu-dua baris. Posisi kanan-bawah agar tidak menutupi header.
 */
export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      gap={10}
      visibleToasts={4}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "glass-strong group relative flex w-[min(360px,calc(100vw-2rem))] items-start gap-3 overflow-hidden rounded-xl px-4 py-3.5 text-[0.86rem] text-foreground " +
            "before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-[var(--toast-accent,var(--primary))]",
          title: "font-semibold leading-snug",
          description: "mt-0.5 text-muted-foreground leading-snug",
          icon: "mt-0.5 shrink-0 text-[var(--toast-accent,var(--primary))]",
          actionButton: "ml-auto shrink-0 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground",
          closeButton: "!bg-white/20 !text-white",
          success: "[--toast-accent:#b9f0c9]",
          error: "[--toast-accent:#ff9b8d]",
          warning: "[--toast-accent:#f9c08a]",
          info: "[--toast-accent:#f5ee9e]",
        },
      }}
      icons={{
        success: <CircleCheck className="size-[18px]" />,
        error: <CircleAlert className="size-[18px]" />,
        warning: <TriangleAlert className="size-[18px]" />,
        info: <Info className="size-[18px]" />,
        loading: <LoaderCircle className="size-[18px] animate-spin" />,
      }}
    />
  );
}

export const toast = {
  success: (title: string, o?: ExternalToast) => sonner.success(title, o),
  error: (title: string, o?: ExternalToast) => sonner.error(title, { duration: 8000, ...o }),
  warning: (title: string, o?: ExternalToast) => sonner.warning(title, o),
  info: (title: string, o?: ExternalToast) => sonner.info(title, o),
  loading: (title: string, o?: ExternalToast) => sonner.loading(title, o),
  dismiss: sonner.dismiss,
  promise: sonner.promise,
};
