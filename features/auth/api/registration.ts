import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { RegistrationResponse } from "../types";
export { parseRegistrationError } from "./registration-errors";

export interface WebRegistrationRequest {
  first_name: string;
  last_name: string;
  business_name: string;
  email: string;
  password: string;
}

export async function registerWebMerchant(payload: WebRegistrationRequest) {
  const { data } = await apiClient.post<RegistrationResponse>(
    "/api/v1/auth/register",
    payload,
  );
  return data;
}

export function useRegisterWebMerchant() {
  return useMutation({
    mutationFn: registerWebMerchant,
    gcTime: 0,
    retry: false,
  });
}
