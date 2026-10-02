import type { Metadata } from "next";
import "./globals.css";
import { AuthNav } from "@/components/ui/auth-nav";

export const metadata: Metadata = {
  title: "Chigir Ale | Civic Infrastructure Platform",
  description: "Smart civic infrastructure reporting, incident management, and public-service coordination platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-emerald-500/20">
        <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="font-bold">Chigir Ale</div>
          <AuthNav />
        </header>
        {children}
      </body>
    </html>
  );
}
