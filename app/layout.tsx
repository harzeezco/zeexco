import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/lib/query-client";

export const metadata: Metadata = {
  metadataBase: new URL("https://zeexco.com"),
  title: "Zeexco -- Built around how you already sell",
  description: "Keep your products, customer conversations, follow-ups and orders organized -- starting with WhatsApp.",
  alternates: { canonical: "/" },
  openGraph: { title: "Zeexco -- Your customers are talking", description: "Join the waitlist for Zeexco, built around how real businesses already sell.", type: "website" },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
