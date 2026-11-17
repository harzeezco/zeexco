"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { normalizeApiError } from "@/lib/api-client";
import {
  useRegisterWhatsAppMerchant,
  isTerminalOnboardingError,
  onboardingErrorCode,
} from "../api/whatsapp-onboarding";
import { parseRegistrationError } from "../api/registration-errors";
import {
  whatsappRegistrationSchema,
  type WhatsAppRegistrationFormData,
} from "../schemas/registration";
import { useRetryAfter } from "../use-retry-after";
import { WebRegistrationLayout } from "./web-registration-layout";
import { RegistrationFields } from "./registration-fields";
import { RegistrationTerms } from "./registration-terms";
import {
  RegistrationConfirmation,
  saveRegistrationConfirmation,
} from "./registration-success";
import { OnboardingFeedback } from "./onboarding-feedback";
import { FormFeedback } from "./form-feedback";

export function WhatsAppRegistrationForm({ token }: { token: string }) {
  const router = useRouter();
  const mutation = useRegisterWhatsAppMerchant();
  const [failureAt, setFailureAt] = useState(0);
  const seconds = useRetryAfter(mutation.error, failureAt);
  const form = useForm<WhatsAppRegistrationFormData>({
    resolver: zodResolver(whatsappRegistrationSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      business_name: "",
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  if (mutation.isSuccess)
    return (
      <RegistrationConfirmation
        email={mutation.variables.email}
        message={mutation.data.message}
        whatsapp
      />
    );
  if (mutation.isError && isTerminalOnboardingError(mutation.error))
    return <OnboardingFeedback error={mutation.error} />;

  const onSubmit = form.handleSubmit((values) => {
    if (mutation.isPending || seconds > 0) return;
    mutation.mutate(
      {
        first_name: values.first_name,
        last_name: values.last_name,
        business_name: values.business_name,
        email: values.email,
        password: values.password,
        onboarding_token: token,
      },
      {
        onSuccess: (response) => {
          form.resetField("password");
          const saved = saveRegistrationConfirmation({
            email: values.email,
            message: response.message,
            whatsapp: true,
          });
          if (saved) router.replace("/register/success");
          else
            window.history.replaceState(
              window.history.state,
              "",
              "/register/success",
            );
        },
        onError: (error) => {
          setFailureAt(Date.now());
          const details = normalizeApiError(error);
          if (details.field && details.field in values)
            form.setError(details.field as keyof WhatsAppRegistrationFormData, {
              type: "server",
              message: details.message,
            });
          toast.error(details.message);
        },
      },
    );
  });

  return (
    <WebRegistrationLayout>
      <div className="mb-6">
        <p className="text-xs font-bold tracking-[0.14em] text-[#1f5bd8] uppercase">
          WhatsApp onboarding
        </p>
        <h1 className="m-0 text-[28px] leading-tight font-bold tracking-[-0.025em] text-[#14233d]">
          Set up Zico for WhatsApp
        </h1>
        <p className="mt-3 mb-0 text-sm leading-6 text-[#61708a]">
          Register, activate your email, then return to your WhatsApp
          conversation to continue onboarding. No browser login is needed.
        </p>
      </div>
      <form
        onSubmit={onSubmit}
        className="grid gap-4"
        noValidate
        aria-busy={mutation.isPending}
      >
        <RegistrationFields form={form} pending={mutation.isPending} />
        {mutation.isError ? (
          <FormFeedback message={parseRegistrationError(mutation.error)} />
        ) : null}
        {mutation.isError &&
        onboardingErrorCode(mutation.error) === "EMAIL_ALREADY_REGISTERED" ? (
          <p className="m-0 text-sm leading-6">
            This email already has an account.{" "}
            <Link href="/login" className="auth-text-link">
              Log in
            </Link>
            . Connecting an existing account to WhatsApp requires a separate
            linking flow.
          </p>
        ) : null}
        {seconds > 0 ? (
          <p role="status">Try again in {seconds} seconds.</p>
        ) : null}
        <Button
          type="submit"
          disabled={mutation.isPending || seconds > 0}
          className="mt-1 h-11 w-full rounded-md bg-[#1f5bd8] text-sm font-bold text-white hover:bg-[#1749b7]"
        >
          {mutation.isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <RegistrationTerms />
    </WebRegistrationLayout>
  );
}
