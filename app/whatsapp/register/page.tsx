import type { Metadata } from "next";
import { WhatsAppRegistrationFlow } from "@/features/auth/components/whatsapp-registration-flow";
import { singleOpaqueToken } from "@/features/auth/opaque-token";

export const metadata: Metadata = {
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default async function WhatsAppRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token: value } = await searchParams;
  const token = singleOpaqueToken(value);
  return <WhatsAppRegistrationFlow key={token || "invalid"} token={token} />;
}
