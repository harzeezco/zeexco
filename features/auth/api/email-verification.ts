import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { apiClient, normalizeApiError } from "@/lib/api-client";
import type { EmailVerificationErrorCode, EmailVerificationRequest } from "../types";

export type VerificationFailure = "invalid" | "consumed" | "expired" | "server" | "network";

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => verifyEmail(token, AbortSignal.timeout(15_000)),
    gcTime: 0,
  });
}

export async function verifyEmail(token: string, signal?: AbortSignal): Promise<void> {
  const payload: EmailVerificationRequest = { token };
  const response = signal
    ? await apiClient.post<void>("/api/v1/auth/verify-email", payload, { signal })
    : await apiClient.post<void>("/api/v1/auth/verify-email", payload);

  if (response.status !== 204) throw new Error(`Unexpected verification response (${response.status}).`);
}

export function parseVerificationError(error: unknown): VerificationFailure {
  if (!axios.isAxiosError(error) || !error.response) return "network";
  const normalized = normalizeApiError(error);
  const code = (normalized.error_code || normalized.code) as EmailVerificationErrorCode | undefined;
  if (error.response.status === 409 || code === "EMAIL_VERIFICATION_CONSUMED") return "consumed";
  if (error.response.status === 410 || code === "EMAIL_VERIFICATION_EXPIRED") return "expired";
  if (error.response.status === 400 || code === "EMAIL_VERIFICATION_INVALID") return "invalid";
  return "server";
}
