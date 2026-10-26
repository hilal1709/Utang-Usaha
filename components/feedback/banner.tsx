import { CircleAlert, Info, Lock, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  info: { icon: Info, cls: "bg-white/[0.12] text-ink backdrop-blur-xl", ring: "ring-white/25" },
  warning: { icon: TriangleAlert, cls: "bg-[#f49e4c]/25 text-[#fff4e3] backdrop-blur-xl", ring: "ring-[#f9c08a]/60" },
  danger: { icon: CircleAlert, cls: "bg-[#ab3428]/40 text-[#ffe9e5] backdrop-blur-xl", ring: "ring-[#ff9b8d]/60" },
  locked: { icon: Lock, cls: "bg-black/20 text-ink backdrop-blur-xl", ring: "ring-white/20" },
} as const;

/** Banner sebaris untuk status halaman (periode terkunci, data belum lengkap, hasil validasi). */
export function Banner({ tone = "info", title, children, action, className }: {
  tone?: keyof typeof TONES; title: string; children?: React.ReactNode; action?: React.ReactNode; className?: string;
}) {
  const t = TONES[tone];
  const Icon = t.icon;
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex flex-wrap items-start gap-3 rounded-xl px-4 py-3 ring-1", t.cls, t.ring, className)}>
      <Icon className="mt-0.5 size-[18px] shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-0.5 opacity-90">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
