"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

/** Dropdown bertema kaca (pengganti <select> bawaan browser). */
export function ThemedSelect({
  value, onChange, options, disabled, id, ariaLabel, className, icon, pill,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  className?: string;
  icon?: React.ReactNode;
  pill?: boolean;
}) {
  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={(v) => { if (typeof v === "string") onChange(v); }}
      items={options}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          "inline-flex h-9 items-center justify-between gap-2 text-left text-sm text-ink outline-none transition-colors select-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60",
          pill ? "glass-pill rounded-full pr-3 pl-3 font-medium" : "glass-input rounded-lg px-3",
          className,
        )}
      >
        {icon}
        <SelectPrimitive.Value className="min-w-0 flex-1 truncate" />
        <SelectPrimitive.Icon render={<ChevronDownIcon className="size-4 shrink-0 text-ink-soft transition-transform data-[popup-open]:rotate-180" />} />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner side="bottom" align="start" sideOffset={6} alignItemWithTrigger={false} className="isolate z-50">
          <SelectPrimitive.Popup
            className="max-h-(--available-height) min-w-(--anchor-width) max-w-[min(26rem,var(--available-width))] origin-(--transform-origin) overflow-y-auto rounded-xl border border-white/25 bg-popover p-1 text-popover-foreground shadow-xl backdrop-blur-xl backdrop-saturate-150 scroll-thin duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          >
            <SelectPrimitive.List>
              {options.map((o) => (
                <SelectPrimitive.Item
                  key={o.value}
                  value={o.value}
                  className="relative flex cursor-default items-center gap-2 rounded-lg py-2 pr-8 pl-3 text-sm text-ink outline-none select-none data-highlighted:bg-white/20 data-selected:font-semibold"
                >
                  <SelectPrimitive.ItemText className="flex-1">{o.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2.5 grid place-items-center text-action">
                    <CheckIcon className="size-4" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
