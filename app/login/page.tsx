import { LoginForm } from "@/features/auth/components/login-form";
import { SessionProvider } from "@/features/auth/components/session-provider";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const { returnTo } = await searchParams;
  return (
    <SessionProvider>
      <LoginForm
        returnTo={typeof returnTo === "string" ? returnTo : undefined}
      />
    </SessionProvider>
  );
}
