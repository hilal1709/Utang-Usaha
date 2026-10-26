"use client";

import { useState, useTransition } from "react";
import { Lock, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/feedback/toaster";
import { monthLabel } from "@/lib/format";
import { setPeriodLock } from "../actions";

/** Mengunci periode tidak bisa dibatalkan oleh OpCo, jadi diminta konfirmasi di modal. */
export function LockToggle({ period, locked }: { period: string; locked: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const run = () => start(async () => {
    const r = await setPeriodLock(period, !locked);
    if (r.ok) toast.success(r.message); else toast.error(r.message);
    setOpen(false);
  });
  return (
    <>
      <Button variant="outline" className="h-9" onClick={() => setOpen(true)}>
        {locked ? <><LockOpen /> Buka kunci</> : <><Lock /> Kunci periode</>}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{locked ? `Buka kunci ${monthLabel(period)}?` : `Kunci ${monthLabel(period)}?`}</DialogTitle>
            <DialogDescription>
              {locked ? "OpCo dapat kembali mengunggah dan mengganti versi aktif periode ini." : "Setelah dikunci, OpCo tidak bisa mengunggah atau mengganti data. Kunci setelah PPT final dikirim ke pimpinan."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
            <Button onClick={run} disabled={pending}>{locked ? "Buka kunci" : "Kunci periode"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
