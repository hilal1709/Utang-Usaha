import { cn } from "@/lib/utils";

/** Panel kaca untuk satu area kerja. Judul menyebut satuan agar angka tidak ambigu. */
export function Panel({ title, unit = "Milyar Rp", action, children, className, bodyClassName, id, reveal }: {
  title: string; unit?: string | null; action?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string; id?: string; reveal?: boolean;
}) {
  return (
    <section id={id} data-aos={reveal ? "fade-up" : undefined} suppressHydrationWarning className={cn("glass-solid flex min-w-0 flex-col rounded-[1.6rem]", className)} aria-labelledby={id ? `${id}-t` : undefined}>
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 px-4 pt-4 sm:px-5">
        <h2 id={id ? `${id}-t` : undefined} className="min-w-0 text-[0.95rem] font-semibold text-ink [text-wrap:balance]">
          {title}
          {unit && <span className="ml-1.5 text-[0.75rem] font-medium text-ink-soft">({unit})</span>}
        </h2>
        {action}
      </div>
      <div className={cn("min-w-0 flex-1 px-4 pt-3 pb-5 sm:px-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="grid min-h-[120px] place-items-center rounded-xl bg-muted px-4 text-center text-sm text-ink-soft">{children}</p>;
}
