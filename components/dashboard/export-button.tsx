"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Lottie } from "@/components/motion/lottie";
import { toast } from "@/components/feedback/toaster";

/** Unduh berkas hasil generate server dengan overlay progres bermerek. */
export async function downloadFrom(url: string, fallbackName: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const msg = await res.json().catch(() => ({ error: "Gagal membuat berkas." }));
    throw new Error(msg.error ?? "Gagal membuat berkas.");
  }
  const blob = await res.blob();
  const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? fallbackName;
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return name;
}

export function ExportButton({ period, kind = "ppt", variant = "default", label }: { period: string; kind?: "ppt" | "xlsx"; variant?: "default" | "outline"; label?: string }) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const name = await downloadFrom(`/api/export/${kind}?period=${period}`, kind === "ppt" ? "Laporan.pptx" : "Gabungan.xlsx");
      toast.success("Berkas siap", { description: name });
    } catch (e) {
      toast.error("Ekspor gagal", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button onClick={run} disabled={busy} variant={variant} className="h-9 px-3.5">
        <Download /> {label ?? (kind === "ppt" ? "Ekspor PPT" : "Ekspor Excel Gabungan")}
      </Button>
      <Dialog open={busy}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <Lottie name="loader" className="mx-auto h-32 w-36" />
          <DialogTitle className="text-center text-base">{kind === "ppt" ? "Menyusun presentasi…" : "Menyusun Excel Gabungan…"}</DialogTitle>
          <DialogDescription className="text-center">
            {kind === "ppt" ? "Grafik dan kesimpulan dihitung dari data aktif periode ini." : "Seluruh baris aktif OpCo ditulis ke sheet Source."}
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}
