import { EmailVerification } from "@/features/auth/components/email-verification";
import type { Metadata } from "next";
import { singleOpaqueToken } from "@/features/auth/opaque-token";

export const metadata: Metadata = {
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = singleOpaqueToken(params.token);
  return <EmailVerification token={token || undefined} />;
}
