"use client";
import { MerchantProfileForm } from "./merchant-profile-form";
import { WebRegistrationLayout } from "./web-registration-layout";
export function WhatsAppRegistrationForm({ token }: { token: string }) {
  return (
    <WebRegistrationLayout>
      <MerchantProfileForm proof={{ onboarding_token: token }} />
    </WebRegistrationLayout>
  );
}
