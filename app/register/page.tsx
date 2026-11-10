import { redirect } from "next/navigation";
import { WebRegistrationForm } from "@/features/auth/components/web-registration-form";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  if (token) redirect(`/whatsapp/register?token=${encodeURIComponent(token)}`);
  return <WebRegistrationForm />;
}
