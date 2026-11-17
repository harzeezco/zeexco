import { normalizeApiError } from "@/lib/api-client";

export function parseRegistrationError(error: unknown) {
  const normalized = normalizeApiError(error);
  switch (normalized.error_code) {
    case "EMAIL_ALREADY_REGISTERED":
      return "An account with this email already exists.";
    case "WHATSAPP_IDENTITY_CONFLICT":
      return "This WhatsApp account is already connected to another Zico account.";
    case "ONBOARDING_TOKEN_EXPIRED":
      return "This registration link has expired.";
    case "ONBOARDING_TOKEN_CONSUMED":
    case "ONBOARDING_TOKEN_ALREADY_USED":
      return "This registration link has already been used.";
    case "ONBOARDING_TOKEN_INVALID":
      return "This registration link is not valid.";
    case "VALIDATION_ERROR":
      return (
        normalized.message ||
        "Some details were not accepted. Check the form and try again."
      );
    default:
      return normalized.message || "Registration failed. Please try again.";
  }
}
