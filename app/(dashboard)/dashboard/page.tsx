import type { Metadata } from "next";
import { SectionPage } from "@/components/dashboard/section-page";

export const metadata: Metadata = { title: "Konsolidasi" };

export default function Page({ searchParams }: PageProps<"/dashboard">) {
  return (
    <SectionPage searchParams={searchParams} sectionKey="konsolidasi" showCategory
      title="Utang usaha SIG Konsolidasi" subject="Utang Usaha SIG Konsolidasi" />
  );
}
