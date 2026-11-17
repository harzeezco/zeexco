"use client";

import { useState } from "react";
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
  const [showPassword, setShowPassword] = useState(false);
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
        label="Email address"
        placeholder="you@example.com"
        type="email"
        inputMode="email"
        autoComplete="email"
        {...form.register("email")}
        error={form.formState.errors.email?.message}
      />
      <RegistrationField
        id="password"
        label="Password"
        placeholder="Create a password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        {...form.register("password", {
          onChange: () => {
            void form.trigger("password");
          },
        })}
        error={form.formState.errors.password?.message}
        helperText="Use at least 8 characters, including a letter, a number and a symbol."
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="inline-flex h-9 items-center gap-1 rounded bg-transparent px-2 text-xs font-semibold text-[#1f5bd8] hover:bg-[#eef4ff]"
          >
            <span className="password-toggle-text">
              {showPassword ? "Hide" : "Show"}
            </span>
          </button>
        }
      />
    </fieldset>
  );
}
