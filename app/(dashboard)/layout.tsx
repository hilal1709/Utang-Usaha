import { requireUser } from "@/lib/session";
import { isAdmin } from "@/lib/access";
import { AppShell, type NavGroup } from "@/components/shell/app-shell";
import { LiveProvider } from "@/components/realtime/live";
import { AosInit } from "@/components/motion/aos-init";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const own = user.role === "OPCO" ? user.opcoCode : null;
  const groups: NavGroup[] = [
    {
      title: "Laporan",
      items: [
        { href: "/dashboard", label: own ? `Konsolidasi ${own}` : "Konsolidasi", icon: "home", exact: true },
        { href: "/dashboard/pihak-ketiga", label: "Pihak Ketiga", icon: "suitcase" },
        { href: "/dashboard/afiliasi", label: "Afiliasi", icon: "category" },
        { href: "/dashboard/bumn", label: "BUMN", icon: "coins" },
        own
          ? { href: `/dashboard/opco/${own}`, label: `Rincian ${own}`, icon: "layers" }
          : { href: "/dashboard/opco", label: "Per OpCo", icon: "layers" },
        { href: "/dashboard/interco", label: "Interco", icon: "chart" },
      ],
    },
    {
      title: "Kelola",
      items: [
        ...(user.role !== "VIEWER" ? [{ href: "/cms/upload", label: "Unggah laporan", icon: "document" as const }] : []),
        ...(isAdmin(user.role) ? [{ href: "/cms/monitoring", label: "Monitoring OpCo", icon: "display" as const }] : []),
        { href: "/cms/export", label: "Ekspor PPT & Excel", icon: "edit-document" },
        { href: "/cms/akun", label: "Akun saya", icon: "avatar" },
      ],
    },
  ];
  return (
    <AppShell theme="dash" groups={groups} user={{ name: user.name, role: user.role, opcoCode: user.opcoCode }} sub="Utang Usaha Group">
      <LiveProvider><AosInit />{children}</LiveProvider>
    </AppShell>
  );
}
