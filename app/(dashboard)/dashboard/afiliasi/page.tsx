import type { Metadata } from "next";
import { SectionPage } from "@/components/dashboard/section-page";

export const metadata: Metadata = { title: "Afiliasi" };

export default function Page({ searchParams }: PageProps<"/dashboard/afiliasi">) {
  return <SectionPage searchParams={searchParams} sectionKey="afiliasi" title="Utang usaha ke Afiliasi" subject="Utang Usaha SIG ke Pihak Afiliasi" />;
}
