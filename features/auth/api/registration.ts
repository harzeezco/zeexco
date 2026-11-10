import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, isNetworkOrServerError, normalizeApiError } from "@/lib/api-client";

export interface WebRegistrationRequest {
  first_name: string;
  last_name: string;
  business_name: string;
  email: string;
  password: string;
}

export interface WhatsAppRegistrationRequest {
  first_name: string;
  last_name: string;
  business_name: string;
  email?: string;
  onboarding_token: string;
}

export interface RegistrationResponse {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    status: "ACTIVE" | "SUSPENDED";
  };
  business: {
    id: string;
    name: string;
    status: "ACTIVE" | "SUSPENDED";
  };
  next_step: "ADD_FIRST_PRODUCT";
}
export interface OnboardingValidationResponse {
  valid: boolean;
  status: "PENDING";
  expires_at?: string;
}

export const onboardingValidationKey = ["whatsapp-onboarding-validation"] as const;

export async function registerWebMerchant(payload: WebRegistrationRequest) {
  const { data } = await apiClient.post<RegistrationResponse>("/api/v1/auth/register", payload);
  return data;
}

export async function validateWhatsAppOnboarding(token: string) {
  const { data } = await apiClient.get<OnboardingValidationResponse>(
    "/api/v1/whatsapp/onboarding/validate",
    { params: { token } },
  );
  return data;
}

export async function registerWhatsAppMerchant(payload: WhatsAppRegistrationRequest) {
  const { data } = await apiClient.post<RegistrationResponse>("/api/v1/whatsapp/onboarding/register", payload);
  return data;
}

export function useRegisterWebMerchant() {
  return useMutation({ mutationFn: registerWebMerchant });
}

export function useValidateWhatsAppOnboarding(token: string | null) {
  return useQuery({
    queryKey: onboardingValidationKey,
    queryFn: () => validateWhatsAppOnboarding(token!),
    enabled: Boolean(token),
    retry: (failureCount, error) => isNetworkOrServerError(error) && failureCount < 1,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function useRegisterWhatsAppMerchant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerWhatsAppMerchant,
    onSuccess: () => queryClient.removeQueries({ queryKey: onboardingValidationKey }),
  });
}

export function parseOnboardingError(error: unknown): { message: string; retryable: boolean } {
  const normalized = normalizeApiError(error);
  switch (normalized.error_code) {
    case "ONBOARDING_TOKEN_EXPIRED":
      return { message: "This registration link has expired.", retryable: false };
    case "ONBOARDING_TOKEN_CONSUMED":
    case "ONBOARDING_TOKEN_ALREADY_USED":
      return { message: "This registration link has already been used.", retryable: false };
    case "WHATSAPP_IDENTITY_CONFLICT":
      return { message: "This WhatsApp account is already connected to another Zeexco account.", retryable: false };
    case "ONBOARDING_TOKEN_INVALID":
    case "VALIDATION_ERROR":
      return { message: "This registration link is not valid.", retryable: false };
    default:
      return { message: "Could not reach Zeexco. Check your connection and try again.", retryable: true };
  }
}

export function parseRegistrationError(error: unknown) {
  const normalized = normalizeApiError(error);
  switch (normalized.error_code) {
    case "EMAIL_ALREADY_REGISTERED": return "An account with this email already exists.";
    case "WHATSAPP_IDENTITY_CONFLICT": return "This WhatsApp account is already connected to another Zeexco account.";
    case "ONBOARDING_TOKEN_EXPIRED": return "This registration link has expired.";
    case "ONBOARDING_TOKEN_CONSUMED":
    case "ONBOARDING_TOKEN_ALREADY_USED": return "This registration link has already been used.";
    case "ONBOARDING_TOKEN_INVALID": return "This registration link is not valid.";
    case "VALIDATION_ERROR": return "Some details were not accepted. Check the form and try again.";
    default: return normalized.message || "Registration failed. Please try again.";
  }
}
