import type { Metadata } from "next";
import { SectionPage } from "@/components/dashboard/section-page";

export const metadata: Metadata = { title: "BUMN" };

export default function Page({ searchParams }: PageProps<"/dashboard/bumn">) {
  return <SectionPage searchParams={searchParams} sectionKey="bumn" title="Utang usaha ke BUMN" subject="Utang Usaha SIG ke BUMN" />;
}
