"use client";

import Link from "next/link";
import { normalizeApiError } from "@/lib/api-client";
import {
  onboardingErrorCode,
  parseOnboardingError,
} from "../api/whatsapp-onboarding";
import { WebRegistrationLayout } from "./web-registration-layout";
import { RegistrationConfirmation } from "./registration-success";

export function OnboardingFeedback({
  error,
  retry,
  seconds = 0,
}: {
  error: unknown;
  retry?: () => void;
  seconds?: number;
}) {
  const code = onboardingErrorCode(error);
  if (code === "ONBOARDING_VERIFICATION_PENDING")
    return (
      <RegistrationConfirmation
        email=""
        message={normalizeApiError(error).message}
        whatsapp
      />
    );
  const issue = parseOnboardingError(error);
  return (
    <WebRegistrationLayout>
      <div className="grid gap-5">
        <h1 className="m-0 text-3xl font-bold">
          {code === "ONBOARDING_TOKEN_EXPIRED"
            ? "This link has expired"
            : code === "ONBOARDING_TOKEN_CONSUMED" ||
                code === "ONBOARDING_TOKEN_ALREADY_USED"
              ? "This link has already been used"
              : issue.retryable
                ? "Registration unavailable"
                : "Invalid registration link"}
        </h1>
        <p role="alert" className="m-0 text-sm leading-6 text-[#64748b]">
          {issue.message}
        </p>
        {seconds > 0 ? (
          <p role="status">Try again in {seconds} seconds.</p>
        ) : null}
        {issue.retryable && retry ? (
          <button
            type="button"
            className="verification-action disabled:opacity-60"
            disabled={seconds > 0}
            onClick={retry}
          >
            Try again
          </button>
        ) : null}
        <p className="m-0 text-sm leading-6 text-[#64748b]">
          Return to the WhatsApp conversation where you started. You can request
          a new Get started link there.
        </p>
        <Link href="/login" className="auth-text-link">
          Log in to an existing account
        </Link>
      </div>
    </WebRegistrationLayout>
  );
}
