"use client";

import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { parseOnboardingError, parseRegistrationError, useRegisterWhatsAppMerchant, useValidateWhatsAppOnboarding } from "../api/registration";
import { whatsappRegistrationSchema, type WhatsAppRegistrationFormData } from "../schemas/registration";
import { AuthLayout } from "./auth-layout";
import { FormFeedback } from "./form-feedback";
import { RegistrationField } from "./registration-field";

function StatusCard({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return <AuthLayout eyebrow="WhatsApp registration" title={title} description={message}>{action}</AuthLayout>;
}

export function WhatsAppRegistrationFlow() {
  const token = useSearchParams().get("token");
  const validation = useValidateWhatsAppOnboarding(token);
  const mutation = useRegisterWhatsAppMerchant();
  const form = useForm<WhatsAppRegistrationFormData>({ resolver: zodResolver(whatsappRegistrationSchema), defaultValues: { first_name: "", last_name: "", business_name: "", email: "" } });

  if (!token) return <StatusCard title="Invalid registration link" message="This WhatsApp registration link is missing the information it needs." />;
  if (validation.isPending) return <StatusCard title="Checking your link" message="Please wait while we securely check your WhatsApp registration link." action={<Spinner aria-label="Checking registration link" className="mx-auto size-8" />} />;
  if (validation.isError) {
    const issue = parseOnboardingError(validation.error);
    return <StatusCard title="Registration issue" message={issue.message} action={issue.retryable ? <Button className="h-12 w-full bg-[#e6532f] text-white" onClick={() => validation.refetch()}>Try again</Button> : undefined} />;
  }
  if (!validation.data?.valid) {
    return <StatusCard title="Registration issue" message="This registration link is not valid." />;
  }
  if (mutation.isSuccess) return <StatusCard title="Your Zeexco business is ready" message="Your WhatsApp is connected to your Zeexco account. You can return to WhatsApp to continue." />;

  const onSubmit = form.handleSubmit((values) => {
    const email = values.email.trim();
    mutation.mutate({ first_name: values.first_name, last_name: values.last_name, business_name: values.business_name, ...(email ? { email } : {}), onboarding_token: token });
  });

  return (
    <AuthLayout eyebrow="WhatsApp registration" title="Finish setting up" description="Add a few business details to finish connecting WhatsApp to Zeexco.">
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <RegistrationField id="first_name" label="First name" autoComplete="given-name" {...form.register("first_name")} error={form.formState.errors.first_name?.message} />
        <RegistrationField id="last_name" label="Last name" autoComplete="family-name" {...form.register("last_name")} error={form.formState.errors.last_name?.message} />
        <RegistrationField id="business_name" label="Business name" autoComplete="organization" {...form.register("business_name")} error={form.formState.errors.business_name?.message} />
        <RegistrationField id="email" label="Email (optional)" type="email" inputMode="email" autoComplete="email" {...form.register("email")} error={form.formState.errors.email?.message} />
        {mutation.isError ? <FormFeedback message={parseRegistrationError(mutation.error)} /> : null}
        <Button type="submit" disabled={mutation.isPending} className="mt-1 h-12 w-full bg-[#e6532f] text-white hover:bg-[#c94525]">{mutation.isPending ? "Creating business…" : "Create my business"}</Button>
      </form>
    </AuthLayout>
  );
}
