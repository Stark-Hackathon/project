import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased selection:bg-emerald-500/20">{children}</body>
    </html>
  );
}
