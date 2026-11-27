"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { normalizeApiError } from "@/lib/api-client";
import {
  registerWebMerchant,
  type RegistrationProof,
} from "../api/registration";
import {
  authenticationError,
  loadSession,
  prepareRegistrationSession,
} from "../api/session";
import { parseRegistrationError } from "../api/registration-errors";
import {
  isTerminalOnboardingError,
  onboardingErrorCode,
  parseOnboardingError,
} from "../api/whatsapp-onboarding";
import {
  webRegistrationSchema,
  type RegistrationFormData,
} from "../schemas/registration";
import { useRetryAfter } from "../use-retry-after";
import { RegistrationFields } from "./registration-fields";
import { RegistrationTerms } from "./registration-terms";
import { FormFeedback } from "./form-feedback";

export function MerchantProfileForm({
  proof,
  restart,
}: {
  proof: RegistrationProof;
  restart?: () => void;
}) {
  const router = useRouter();
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [failedAt, setFailedAt] = useState(0);
  const seconds = useRetryAfter(error, failedAt);
  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(webRegistrationSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      business_name: "",
      email: "",
    },
    mode: "onBlur",
  });
  async function finishSession() {
    try {
      await loadSession();
      setSessionReady(true);
      router.replace("/account");
    } catch (failure) {
      setError(failure);
      setFailedAt(Date.now());
    }
  }
  async function submit(values: RegistrationFormData) {
    if (locked.current || seconds > 0 || registered) return;
    locked.current = true;
    setPending(true);
    setError(null);
    try {
      await registerWebMerchant({ ...values, ...proof });
      setRegistered(true);
      prepareRegistrationSession();
      await finishSession();
    } catch (failure) {
      setError(failure);
      setFailedAt(Date.now());
      const details = normalizeApiError(failure);
      if (details.field && details.field in values)
        form.setError(details.field as keyof RegistrationFormData, {
          message: details.message,
        });
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  if (registered)
    return (
      <div className="grid gap-4">
        <h1 className="text-[28px] font-bold">Account created</h1>
        {pending || sessionReady ? (
          <p role="status">Opening your account...</p>
        ) : (
          <>
            <FormFeedback
              message={
                "Your account was created, but we could not open your session. " +
                authenticationError(error)
              }
            />
            {seconds > 0 ? (
              <p role="status">Try again in {seconds} seconds.</p>
            ) : null}
            <Button
              disabled={pending || seconds > 0}
              onClick={async () => {
                if (locked.current || seconds > 0) return;
                locked.current = true;
                setPending(true);
                setError(null);
                try {
                  await finishSession();
                } finally {
                  locked.current = false;
                  setPending(false);
                }
              }}
            >
              Retry session
            </Button>
            <Link href="/login" className="auth-text-link">
              Go to login
            </Link>
          </>
        )}
      </div>
    );
  if (error && isTerminalOnboardingError(error))
    return (
      <div className="grid gap-4">
        <h1 className="text-[28px] font-bold">
          {onboardingErrorCode(error) === "ONBOARDING_VERIFICATION_PENDING"
            ? "Check your email"
            : "Registration link unavailable"}
        </h1>
        <FormFeedback
          message={
            onboardingErrorCode(error) === "ONBOARDING_VERIFICATION_PENDING"
              ? normalizeApiError(error).message
              : parseOnboardingError(error).message
          }
        />
        <Link href="/login" className="auth-text-link">
          Log in to an existing account
        </Link>
      </div>
    );
  const invalidProof =
    error &&
    normalizeApiError(error).error_code === "REGISTRATION_PROOF_INVALID";
  return (
    <>
      <h1 className="m-0 text-[28px] font-bold text-[#14233d]">
        Tell us about your business
      </h1>
      <p className="mt-2 mb-6 text-sm text-[#68778f]">
        Complete your profile to open your Zico account.
      </p>
      <form
        onSubmit={(event) => void form.handleSubmit(submit)(event)}
        noValidate
        className="grid gap-4"
        aria-busy={pending}
      >
        <RegistrationFields form={form} pending={pending} />
        {error ? (
          <FormFeedback message={parseRegistrationError(error)} />
        ) : null}
        {seconds > 0 ? (
          <p role="status">Try again in {seconds} seconds.</p>
        ) : null}
        {invalidProof ? (
          restart ? (
            <Button type="button" onClick={restart}>
              Restart verification
            </Button>
          ) : (
            <p role="alert">
              Return to WhatsApp and request a fresh registration link.
            </p>
          )
        ) : (
          <Button
            type="submit"
            disabled={pending || seconds > 0}
            className="h-11 w-full bg-[#1f5bd8] text-white"
          >
            {pending ? "Creating account..." : "Create account"}
          </Button>
        )}
      </form>
      <RegistrationTerms />
    </>
  );
}
