import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/lib/query-client";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "@/features/auth/components/session-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://zeexco.com"),
  title: "Zico — Built around how you already sell",
  description: "Keep your products, customer conversations, follow-ups and orders organized -- starting with WhatsApp.",
  alternates: { canonical: "/" },
  openGraph: { title: "Zico — Your customers are talking", description: "Join the waitlist for Zico, a product by Zeexco built around how real businesses already sell.", type: "website" },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider><SessionProvider>{children}</SessionProvider></QueryProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
