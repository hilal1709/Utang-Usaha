import { requireUser } from "@/lib/session";
import { isAdmin } from "@/lib/access";
import { AppShell, type NavGroup } from "@/components/shell/app-shell";
import { LiveProvider } from "@/components/realtime/live";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const admin = isAdmin(user.role);
  const groups: NavGroup[] = [
    {
      title: "Laporan bulanan",
      items: [
        ...(user.role !== "VIEWER" ? [{ href: "/cms/upload", label: "Unggah laporan", icon: "document" as const }] : []),
        ...(admin ? [{ href: "/cms/monitoring", label: "Monitoring OpCo", icon: "display" as const }] : []),
        { href: "/cms/export", label: "Ekspor PPT & Excel", icon: "edit-document" },
      ],
    },
    {
      title: "Pengaturan",
      items: [
        ...(admin ? [{ href: "/cms/master", label: "Master data", icon: "settings" as const }] : []),
        ...(user.role === "SUPERADMIN" ? [{ href: "/cms/users", label: "Akun & hak akses", icon: "check" as const }] : []),
        { href: "/cms/akun", label: "Akun saya", icon: "avatar" },
      ],
    },
    { title: "Dashboard", items: [{ href: "/dashboard", label: "Lihat dashboard", icon: "home", exact: true }] },
  ];
  return (
    <AppShell theme="cms" groups={groups} user={{ name: user.name, role: user.role, opcoCode: user.opcoCode }} sub="CMS Laporan Utang">
      <LiveProvider notify={false}>{children}</LiveProvider>
    </AppShell>
  );
}
