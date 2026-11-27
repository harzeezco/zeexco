import { useId } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient, normalizeApiError } from "@/lib/api-client";
import {
  registerWebMerchant,
  type WebRegistrationRequest,
} from "./registration";

export type WhatsAppRegistrationRequest = WebRegistrationRequest & {
  onboarding_token: string;
};

export interface OnboardingValidationResponse {
  valid: boolean;
  status: "PENDING";
  expires_at?: string;
}

export const onboardingValidationKey = [
  "whatsapp-onboarding-validation",
] as const;

export async function validateWhatsAppOnboarding(token: string) {
  const { data } = await apiClient.get<OnboardingValidationResponse>(
    "/api/v1/whatsapp/onboarding/validate",
    { params: { token } },
  );
  return data;
}

export async function registerWhatsAppMerchant(
  payload: WhatsAppRegistrationRequest,
) {
  return registerWebMerchant(payload);
}

export function useValidateWhatsAppOnboarding(token: string | null) {
  // Isolate each mounted journey without putting its secret into cache keys.
  const instanceId = useId();
  return useQuery({
    queryKey: [...onboardingValidationKey, instanceId],
    queryFn: () => validateWhatsAppOnboarding(token!),
    enabled: Boolean(token),
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useRegisterWhatsAppMerchant() {
  return useMutation({
    mutationFn: registerWhatsAppMerchant,
    gcTime: 0,
    retry: false,
  });
}

export function parseOnboardingError(error: unknown): {
  message: string;
  retryable: boolean;
} {
  const normalized = normalizeApiError(error);
  switch (normalized.error_code) {
    case "ONBOARDING_TOKEN_EXPIRED":
      return {
        message:
          "This registration link has expired. Return to your WhatsApp chat and request a new Get started link.",
        retryable: false,
      };
    case "ONBOARDING_TOKEN_CONSUMED":
    case "ONBOARDING_TOKEN_ALREADY_USED":
      return {
        message:
          "This registration link has already been used. Log in if you have an account, or return to the WhatsApp chat where you started.",
        retryable: false,
      };
    case "WHATSAPP_IDENTITY_CONFLICT":
      return {
        message:
          "This WhatsApp account is already connected to another Zico account.",
        retryable: false,
      };
    case "ONBOARDING_TOKEN_INVALID":
    case "ONBOARDING_TOKEN_REQUIRED":
    case "VALIDATION_ERROR":
      return {
        message: "This registration link is not valid.",
        retryable: false,
      };
    default:
      return {
        message: "Could not reach Zico. Check your connection and try again.",
        retryable: true,
      };
  }
}

export function onboardingErrorCode(error: unknown) {
  return normalizeApiError(error).error_code || normalizeApiError(error).code;
}

export function isTerminalOnboardingError(error: unknown) {
  return [
    "ONBOARDING_TOKEN_INVALID",
    "ONBOARDING_TOKEN_REQUIRED",
    "ONBOARDING_TOKEN_EXPIRED",
    "ONBOARDING_TOKEN_CONSUMED",
    "ONBOARDING_TOKEN_ALREADY_USED",
    "ONBOARDING_VERIFICATION_PENDING",
  ].includes(onboardingErrorCode(error) || "");
}
