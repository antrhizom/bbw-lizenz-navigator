import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AnalyticsProvider } from "@/components/layout/AnalyticsProvider";

export const metadata: Metadata = {
  title: "Lizenz-Navigator | BBW Winterthur",
  description:
    "Übersicht über die digitalen Lerntechnologien und Lizenzen der Berufsbildungsschule Winterthur",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased min-h-screen flex flex-col">
        <AnalyticsProvider />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
