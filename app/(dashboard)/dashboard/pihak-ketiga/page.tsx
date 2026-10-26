import type { Metadata } from "next";
import { SectionPage } from "@/components/dashboard/section-page";

export const metadata: Metadata = { title: "Pihak Ketiga" };

export default function Page({ searchParams }: PageProps<"/dashboard/pihak-ketiga">) {
  return <SectionPage searchParams={searchParams} sectionKey="thirdParties" title="Utang usaha ke Pihak Ketiga" subject="Utang Usaha SIG ke Pihak Ketiga" />;
}
