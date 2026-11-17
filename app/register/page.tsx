import type { Metadata } from "next";
import { WebRegistrationForm } from "@/features/auth/components/web-registration-form";
import { WhatsAppRegistrationFlow } from "@/features/auth/components/whatsapp-registration-flow";
import { singleOpaqueToken } from "@/features/auth/opaque-token";

export const metadata: Metadata = {
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  if (params.token !== undefined) {
    const token = singleOpaqueToken(params.token);
    return <WhatsAppRegistrationFlow key={token || "invalid"} token={token} />;
  }
  return <WebRegistrationForm />;
}
