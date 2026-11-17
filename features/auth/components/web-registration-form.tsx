"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { normalizeApiError } from "@/lib/api-client";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  parseRegistrationError,
  useRegisterWebMerchant,
} from "../api/registration";
import { useRetryAfter } from "../use-retry-after";
import {
  webRegistrationSchema,
  type WebRegistrationFormData,
} from "../schemas/registration";
import { FormFeedback } from "./form-feedback";
import { RegistrationFields } from "./registration-fields";
import { RegistrationTerms } from "./registration-terms";
import { WebRegistrationLayout } from "./web-registration-layout";
import { AccountSwitch } from "./account-switch";
import {
  RegistrationConfirmation,
  saveRegistrationConfirmation,
} from "./registration-success";

export function WebRegistrationForm() {
  const router = useRouter();
  const mutation = useRegisterWebMerchant();
  const [failureAt, setFailureAt] = useState(0);
  const seconds = useRetryAfter(mutation.error, failureAt);
  const form = useForm<WebRegistrationFormData>({
    resolver: zodResolver(webRegistrationSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      business_name: "",
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  if (mutation.isSuccess && mutation.data) {
    return (
      <RegistrationConfirmation
        email={mutation.variables?.email || form.getValues("email")}
        message={mutation.data.message}
      />
    );
  }
  const onSubmit = form.handleSubmit((values) => {
    if (mutation.isPending || seconds > 0) return;
    mutation.mutate(
      {
        first_name: values.first_name,
        last_name: values.last_name,
        business_name: values.business_name,
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: (response) => {
          form.resetField("password");
          const saved = saveRegistrationConfirmation({
            email: values.email,
            message:
              response.message ||
              "Your registration was successful. Verify your email to continue.",
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
          if (details.field && details.field in values) {
            form.setError(details.field as keyof WebRegistrationFormData, {
              type: "server",
              message: details.message,
            });
          }
          toast.error(details.message || parseRegistrationError(error));
        },
      },
    );
  });

  return (
    <WebRegistrationLayout>
      <AccountSwitch page="register" />
      <div className="mb-6">
        <h1 className="m-0 text-[28px] leading-tight font-bold tracking-[-0.025em] text-[#14233d]">
          Create your Zico account
        </h1>
        <p className="mt-2 mb-0 text-sm text-[#68778f]">
          A simpler way to run your everyday business.
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
