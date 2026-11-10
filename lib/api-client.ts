import axios, { AxiosError } from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || undefined,
  headers: { "Content-Type": "application/json" },
});

export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    field?: string;
  };
  message?: string;
  error_code?: string;
  code?: string;
  field?: string;
}

export function normalizeApiError(error: unknown): Required<Pick<ApiErrorBody, "message">> & ApiErrorBody {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data;
    const apiError = body?.error;
    return {
      error_code: apiError?.code ?? body?.error_code ?? body?.code,
      code: apiError?.code ?? body?.code,
      field: apiError?.field ?? body?.field,
      message: apiError?.message ?? body?.message ?? error.message ?? "Something went wrong.",
    };
  }
  if (error instanceof Error) return { message: error.message };
  return { message: "Something went wrong." };
}

export function isNetworkOrServerError(error: unknown) {
  if (!axios.isAxiosError(error)) return false;
  const status = (error as AxiosError).response?.status;
  return status === undefined || status >= 500;
}
