"use client";

import { useValidateWhatsAppOnboarding } from "../api/whatsapp-onboarding";
import { useRetryAfter } from "../use-retry-after";
import { WebRegistrationLayout } from "./web-registration-layout";
import { WhatsAppRegistrationForm } from "./whatsapp-registration-form";
import { OnboardingFeedback } from "./onboarding-feedback";

export function WhatsAppRegistrationFlow({ token }: { token: string | null }) {
  const validation = useValidateWhatsAppOnboarding(token);
  const seconds = useRetryAfter(validation.error, validation.errorUpdatedAt);
  if (!token)
    return (
      <WebRegistrationLayout>
        <h1 className="text-3xl font-bold">Invalid registration link</h1>
        <p className="text-sm leading-6 text-[#64748b]">
          Return to your WhatsApp conversation and request a new Get started
          link.
        </p>
      </WebRegistrationLayout>
    );
  if (validation.isPending || validation.isFetching)
    return (
      <WebRegistrationLayout>
        <h1 className="text-3xl font-bold">Checking your link</h1>
        <p role="status" className="text-sm leading-6 text-[#64748b]">
          Please wait while we check your WhatsApp registration link.
        </p>
      </WebRegistrationLayout>
    );
  if (validation.isError)
    return (
      <OnboardingFeedback
        error={validation.error}
        seconds={seconds}
        retry={() => {
          if (seconds === 0) void validation.refetch();
        }}
      />
    );
  if (!validation.data?.valid || validation.data.status !== "PENDING")
    return (
      <WebRegistrationLayout>
        <h1 className="text-3xl font-bold">Invalid registration link</h1>
        <p className="text-sm leading-6 text-[#64748b]">
          Return to WhatsApp and request a new Get started link.
        </p>
      </WebRegistrationLayout>
    );
  return <WhatsAppRegistrationForm token={token} />;
}
