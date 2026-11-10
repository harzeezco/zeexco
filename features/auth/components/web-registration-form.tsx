"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { parseRegistrationError, useRegisterWebMerchant } from "../api/registration";
import { webRegistrationSchema, type WebRegistrationFormData } from "../schemas/registration";
import { AuthLayout } from "./auth-layout";
import { FormFeedback } from "./form-feedback";
import { RegistrationField } from "./registration-field";

export function WebRegistrationForm() {
  const mutation = useRegisterWebMerchant();
  const form = useForm<WebRegistrationFormData>({ resolver: zodResolver(webRegistrationSchema), defaultValues: { first_name: "", last_name: "", business_name: "", email: "", password: "", confirm_password: "" } });

  if (mutation.isSuccess) {
    return <AuthLayout eyebrow="Account created" title="Welcome to Zeexco" description="Your business account is ready. You can continue to sign in."><Link href="/login" className="flex h-12 items-center justify-center rounded-md bg-[#e6532f] font-bold text-white no-underline">Continue to login</Link></AuthLayout>;
  }

  const onSubmit = form.handleSubmit((values) => mutation.mutate({
    first_name: values.first_name,
    last_name: values.last_name,
    business_name: values.business_name,
    email: values.email,
    password: values.password,
  }));
  return (
    <AuthLayout eyebrow="Web registration" title="Create your account" description="Set up your Zeexco business account with your email and password.">
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <RegistrationField id="first_name" label="First name" autoComplete="given-name" {...form.register("first_name")} error={form.formState.errors.first_name?.message} />
        <RegistrationField id="last_name" label="Last name" autoComplete="family-name" {...form.register("last_name")} error={form.formState.errors.last_name?.message} />
        <RegistrationField id="business_name" label="Business name" autoComplete="organization" {...form.register("business_name")} error={form.formState.errors.business_name?.message} />
        <RegistrationField id="email" label="Email" type="email" inputMode="email" autoComplete="email" {...form.register("email")} error={form.formState.errors.email?.message} />
        <RegistrationField id="password" label="Password" type="password" autoComplete="new-password" {...form.register("password")} error={form.formState.errors.password?.message} />
        <RegistrationField id="confirm_password" label="Confirm password" type="password" autoComplete="new-password" {...form.register("confirm_password")} error={form.formState.errors.confirm_password?.message} />
        {mutation.isError ? <FormFeedback message={parseRegistrationError(mutation.error)} /> : null}
        <Button type="submit" disabled={mutation.isPending} className="mt-1 h-12 w-full bg-[#e6532f] text-white hover:bg-[#c94525]">{mutation.isPending ? "Creating account…" : "Create account"}</Button>
      </form>
    </AuthLayout>
  );
}
