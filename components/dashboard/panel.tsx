import { cn } from "@/lib/utils";

/** Panel kaca untuk satu area kerja. Judul menyebut satuan agar angka tidak ambigu. */
export function Panel({ title, unit = "Milyar Rp", action, children, className, bodyClassName, id, reveal }: {
  title: string; unit?: string | null; action?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string; id?: string; reveal?: boolean;
}) {
  return (
    <section id={id} data-aos={reveal ? "fade-up" : undefined} suppressHydrationWarning className={cn("glass-solid flex min-w-0 flex-col rounded-[1.6rem]", className)} aria-labelledby={id ? `${id}-t` : undefined}>
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <h2 id={id ? `${id}-t` : undefined} className="text-[0.95rem] font-semibold text-ink">
          {title}
          {unit && <span className="ml-1.5 text-[0.75rem] font-medium text-ink-soft">({unit})</span>}
        </h2>
        {action}
      </div>
      <div className={cn("flex-1 px-5 pt-3 pb-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="grid min-h-[120px] place-items-center rounded-xl bg-muted px-4 text-center text-sm text-ink-soft">{children}</p>;
}
