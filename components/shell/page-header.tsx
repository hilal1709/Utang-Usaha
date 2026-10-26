"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { ThemedSelect } from "@/components/ui/themed-select";
import { LiveBadge } from "@/components/realtime/live";
import { monthLabel } from "@/lib/format";

export function PeriodSelect({ periods, value }: { periods: { period: string; hasDetail: boolean }[]; value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <ThemedSelect
      pill
      ariaLabel="Periode laporan"
      value={value}
      onChange={(v) => {
        const next = new URLSearchParams(params);
        next.set("period", v);
        router.push(`${pathname}?${next.toString()}`);
      }}
      options={periods.map((p) => ({ value: p.period, label: `${monthLabel(p.period)}${p.hasDetail ? "" : " (tren saja)"}` }))}
      icon={<CalendarDays className="size-4 shrink-0 text-ink-soft" aria-hidden />}
    />
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 px-4 pt-6 pb-5 sm:px-8 lg:pt-9">
      <div className="min-w-0">
        <h1 className="text-[1.6rem] font-semibold leading-tight tracking-[-0.025em] text-ink [text-wrap:balance] sm:text-[1.85rem]">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-ink-soft">{description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <LiveBadge />
        {actions}
      </div>
    </header>
  );
}
