"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { normalizeApiError } from "@/lib/api-client";
import { authenticationError, retryAfterSeconds } from "../api/session";
import { useLogin } from "../api/session-mutations";
import { safeReturnTo } from "../return-path";
import { loginSchema, type LoginValues } from "../schemas/login";
import { useSession } from "./session-provider";
import { RegistrationField } from "./registration-field";
import { VerificationLayout } from "./verification-layout";

export function LoginForm({ returnTo }: { returnTo?: string } = {}) {
  const router = useRouter();
  const destination = safeReturnTo(returnTo);
  const session = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const mutation = useLogin();
  const message = mutation.isError ? authenticationError(mutation.error) : session.error || "";
  const pendingEmail = mutation.isError && normalizeApiError(mutation.error).code === "EMAIL_VERIFICATION_REQUIRED"
    ? mutation.variables?.email
    : null;
  const pending = mutation.isPending;
  const [retryAt, setRetryAt] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" }, mode: "onBlur" });

  useEffect(() => {
    if (session.status === "authenticated" && mutation.isIdle) router.replace(destination);
  }, [session.status, mutation.isIdle, router, destination]);
  useEffect(() => {
    if (!retryAt) return;
    const timer = window.setInterval(() => setSeconds(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);

  function submit(values: LoginValues) {
    if (pending || Date.now() < retryAt) return;
    mutation.mutate(values, {
      onSuccess: (response) => {
        form.resetField("password");
        toast.success(response.message);
        router.replace(destination);
      },
      onError: (error) => {
        const details = normalizeApiError(error);
        const errorMessage = authenticationError(error);
        if (details.code === "EMAIL_VERIFICATION_REQUIRED") form.resetField("password");
        const delay = retryAfterSeconds(error) || 2;
        setRetryAt(Date.now() + delay * 1000);
        setSeconds(delay);
        toast.error(errorMessage);
      },
    });
  }

  if (session.status === "restoring") return (
    <VerificationLayout variant="login" eyebrow="Welcome back" title="Checking your session" description="Please wait while we check whether you are already logged in.">
      <p role="status">Checking your session...</p>
    </VerificationLayout>
  );

  if (pendingEmail) return (
    <VerificationLayout eyebrow="Verify your email" title="Check your email" description={message}>
      <div className="verification-notice"><span>Open the verification link sent to <strong className="break-all">{pendingEmail}</strong> to activate your account. Check your spam or junk folder too.</span></div>
      <button type="button" className="verification-action mt-5" onClick={() => mutation.reset()}>Return to login</button>
    </VerificationLayout>
  );

  return (
    <VerificationLayout variant="login" eyebrow="Welcome back" title="Log in to your account" description="Good to see you again. Enter your details to continue.">
      <form onSubmit={(event) => void form.handleSubmit(submit)(event)} noValidate className="grid gap-5" aria-busy={pending}>
        <RegistrationField id="login-email" label="Email address" type="email" autoComplete="username" placeholder="you@example.com" {...form.register("email")} error={form.formState.errors.email?.message} disabled={pending} />
        <RegistrationField id="login-password" label="Password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" {...form.register("password")} error={form.formState.errors.password?.message} disabled={pending} trailing={
          <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="grid size-9 place-items-center rounded text-[#61708a] hover:bg-[#f3f6fc]">
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        } />
        {message ? <p role="alert" className="m-0 text-sm text-[#b42318]">{message}</p> : null}
        {seconds > 0 ? <p role="status" className="m-0 text-sm text-[#61708a]">Try again in {seconds} seconds.</p> : null}
        <button type="submit" disabled={pending || seconds > 0} className="verification-action cursor-pointer border-0 disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Logging in..." : "Log in"}</button>
      </form>
    </VerificationLayout>
  );
}
