import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { RegistrationResponse } from "../types";
import type { RegistrationFormData } from "../schemas/registration";
export { parseRegistrationError } from "./registration-errors";

export type RegistrationProof =
  | { registration_challenge_token: string; onboarding_token?: never }
  | { onboarding_token: string; registration_challenge_token?: never };
export type WebRegistrationRequest = Omit<RegistrationFormData, "email"> & {
  email?: string;
} & RegistrationProof;
export async function registerWebMerchant(payload: WebRegistrationRequest) {
  const { first_name, last_name, business_name, email } = payload;
  const proof =
    "onboarding_token" in payload && payload.onboarding_token
      ? { onboarding_token: payload.onboarding_token }
      : { registration_challenge_token: payload.registration_challenge_token };
  const { data, status } = await apiClient.post<RegistrationResponse>(
    "/api/v1/auth/register",
    {
      first_name,
      last_name,
      business_name,
      ...(email ? { email } : {}),
      ...proof,
    },
  );
  if (status !== 201)
    throw new Error("Registration did not complete. Please try again.");
  return data;
}
export function useRegisterWebMerchant() {
  return useMutation({
    mutationFn: registerWebMerchant,
    gcTime: 0,
    retry: false,
  });
}
export interface WhatsAppChallenge {
  challenge_id: string;
  expires_at: string;
  message: string;
}
export async function requestWhatsAppOTP(whatsapp_number: string) {
  const { data } = await apiClient.post<WhatsAppChallenge>(
    "/api/v1/auth/whatsapp-otp/request",
    { whatsapp_number },
  );
  return data;
}
export async function verifyWhatsAppOTP(challenge_id: string, otp: string) {
  const { data } = await apiClient.post<{
    registration_challenge_token: string;
  }>("/api/v1/auth/whatsapp-otp/verify", { challenge_id, otp });
  return data;
}
