import { EmailVerification } from "@/features/auth/components/email-verification";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  return <EmailVerification token={token || undefined} />;
}
