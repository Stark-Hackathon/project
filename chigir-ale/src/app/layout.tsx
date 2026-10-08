import type { Metadata } from "next";
import "./globals.css";
import { ChigrNavbar } from "@/components/layout/chigr-navbar";
import { ChigrFooter } from "@/components/layout/chigr-footer";
import { OfflineBanner } from "@/features/mobile/components/offline-banner";
import { LanguageProvider } from "@/lib/i18n/language-context";

export const metadata: Metadata = {
  title: "Chigr Ale — See it. Report it. Improve your community.",
  description:
    "Chigr Ale connects residents with responsible municipal response teams by turning real-world infrastructure failures into location-based, evidence-supported, trackable civic action in Addis Ababa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-emerald-500/20 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans">
        <LanguageProvider>
          <OfflineBanner />
          <ChigrNavbar />
          <div className="flex-1 w-full">{children}</div>
          <ChigrFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
