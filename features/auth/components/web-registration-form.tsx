"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { normalizeApiError } from "@/lib/api-client";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { parseRegistrationError, useRegisterWebMerchant } from "../api/registration";
import { webRegistrationSchema, type WebRegistrationFormData } from "../schemas/registration";
import { FormFeedback } from "./form-feedback";
import { RegistrationField } from "./registration-field";
import { WebRegistrationLayout } from "./web-registration-layout";
import { AccountSwitch } from "./account-switch";
import { RegistrationConfirmation, saveRegistrationConfirmation } from "./registration-success";

export function WebRegistrationForm() {
  const router = useRouter();
  const mutation = useRegisterWebMerchant();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<WebRegistrationFormData>({
    resolver: zodResolver(webRegistrationSchema),
    defaultValues: { first_name: "", last_name: "", business_name: "", email: "", password: "" },
    mode: "onBlur",
  });

  if (mutation.isSuccess && mutation.data) {
    return <RegistrationConfirmation email={mutation.data.user?.email || form.getValues("email")} message={mutation.data.message || "Your registration was successful. Verify your email to continue."} />;
  }
  const onSubmit = form.handleSubmit((values) => mutation.mutate({
    first_name: values.first_name,
    last_name: values.last_name,
    business_name: values.business_name,
    email: values.email,
    password: values.password,
  }, {
    onSuccess: (response) => {
      if (saveRegistrationConfirmation({
        email: response.user?.email || values.email,
        message: response.message || "Your registration was successful. Verify your email to continue.",
      })) router.replace("/register/success");
    },
    onError: (error) => {
      const details = normalizeApiError(error);
      if (details.field && details.field in values) {
        form.setError(details.field as keyof WebRegistrationFormData, { type: "server", message: details.message });
      }
      toast.error(details.message || parseRegistrationError(error));
    },
  }));

  return (
    <WebRegistrationLayout>
      <AccountSwitch page="register" />
      <div className="mb-6">

        <h1 className="m-0 text-[28px] leading-tight font-bold tracking-[-0.025em] text-[#14233d]">Create your Zico account</h1>
        <p className="mt-2 mb-0 text-sm text-[#68778f]">A simpler way to run your everyday business.</p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <div className="grid gap-4 items-start sm:grid-cols-2">
          <RegistrationField id="first_name" label="First name" placeholder="e.g. Ada" autoComplete="given-name" {...form.register("first_name")} error={form.formState.errors.first_name?.message} />
          <RegistrationField id="last_name" label="Last name" placeholder="e.g. Okafor" autoComplete="family-name" {...form.register("last_name")} error={form.formState.errors.last_name?.message} />
        </div>
        <RegistrationField id="business_name" label="Business name" placeholder="Your business name" autoComplete="organization" {...form.register("business_name")} error={form.formState.errors.business_name?.message} />
        <RegistrationField id="email" label="Email address" placeholder="you@example.com" type="email" inputMode="email" autoComplete="email" {...form.register("email")} error={form.formState.errors.email?.message} />
        <RegistrationField
          id="password"
          label="Password"
          placeholder="Create a password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          {...form.register("password", {
            onChange: () => { void form.trigger("password"); },
          })}
          error={form.formState.errors.password?.message}
          helperText="Use at least 8 characters, including a letter, a number and a symbol."
          trailing={
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="inline-flex h-9 items-center gap-1 rounded bg-transparent px-2 text-xs font-semibold text-[#1f5bd8] hover:bg-[#eef4ff]">
              <span className="password-toggle-text">{showPassword ? "Hide" : "Show"}</span>
            </button>
          }
        />
        {mutation.isError ? <FormFeedback message={parseRegistrationError(mutation.error)} /> : null}
        <Button type="submit" disabled={mutation.isPending} className="mt-1 h-11 w-full rounded-md bg-[#1f5bd8] text-sm font-bold text-white hover:bg-[#1749b7]">{mutation.isPending ? "Creating accountâ€¦" : "Create account"}</Button>
      </form>

      <p className="mt-5 text-xs leading-5 text-[#69778e]">By creating an account, you agree to Zico&apos;s <Link href="/terms" className="font-medium text-[#1f5bd8]">Terms</Link> and <Link href="/privacy" className="font-medium text-[#1f5bd8]">Privacy Policy</Link>.</p>

    </WebRegistrationLayout>
  );
}
