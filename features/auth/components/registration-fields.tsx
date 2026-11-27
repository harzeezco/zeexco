"use client";

import type { UseFormReturn } from "react-hook-form";
import type { RegistrationFormData } from "../schemas/registration";
import { RegistrationField } from "./registration-field";

export function RegistrationFields({
  form,
  pending,
}: {
  form: UseFormReturn<RegistrationFormData>;
  pending: boolean;
}) {
  return (
    <fieldset
      disabled={pending}
      className="m-0 grid min-w-0 gap-4 border-0 p-0"
    >
      <div className="grid gap-4 items-start sm:grid-cols-2">
        <RegistrationField
          id="first_name"
          label="First name"
          placeholder="e.g. Ada"
          autoComplete="given-name"
          {...form.register("first_name")}
          error={form.formState.errors.first_name?.message}
        />
        <RegistrationField
          id="last_name"
          label="Last name"
          placeholder="e.g. Okafor"
          autoComplete="family-name"
          {...form.register("last_name")}
          error={form.formState.errors.last_name?.message}
        />
      </div>
      <RegistrationField
        id="business_name"
        label="Business name"
        placeholder="Your business name"
        autoComplete="organization"
        {...form.register("business_name")}
        error={form.formState.errors.business_name?.message}
      />
      <RegistrationField
        id="email"
        label="Email address (optional)"
        placeholder="you@example.com"
        type="email"
        inputMode="email"
        autoComplete="email"
        {...form.register("email")}
        error={form.formState.errors.email?.message}
      />
    </fieldset>
  );
}
