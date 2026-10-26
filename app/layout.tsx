import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppToaster } from "@/components/feedback/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "AP Insight", template: "%s · AP Insight" },
  description: "Konsolidasi & dashboard aging utang usaha Group — Unit AR/AP Management & Liquidity.",
};

export const viewport: Viewport = { themeColor: "#2d728f" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <TooltipProvider>{children}</TooltipProvider>
        <AppToaster />
      </body>
    </html>
  );
}
