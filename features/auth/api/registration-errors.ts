import { normalizeApiError } from "@/lib/api-client";

export function parseRegistrationError(error: unknown) {
  const normalized = normalizeApiError(error);
  switch (normalized.error_code) {
    case "INVALID_WHATSAPP_NUMBER":
      return "Enter a valid international WhatsApp number with country code.";
    case "OTP_INVALID":
      return "We could not verify this code. Try again or request a new code.";
    case "OTP_DELIVERY_UNAVAILABLE":
      return "WhatsApp code delivery is temporarily unavailable. Please try again later.";
    case "REGISTRATION_PROOF_INVALID":
      return "Your registration verification is no longer valid. Restart verification or request a fresh invitation.";
    case "CSRF_ORIGIN_REJECTED":
      return "The frontend origin is not allowed by the API configuration. Please contact support.";
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
