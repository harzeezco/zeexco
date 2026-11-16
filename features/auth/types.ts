export interface UserSummary {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
}

export interface BusinessSummary {
  id: string;
  name: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
}

export interface RegistrationResponse {
  status_code?: number;
  message?: string;
  user: UserSummary;
  business: BusinessSummary;
  next_step: "VERIFY_EMAIL" | "ADD_FIRST_PRODUCT";
}

export interface EmailVerificationRequest {
  token: string;
}

export type EmailVerificationErrorCode =
  | "EMAIL_VERIFICATION_INVALID"
  | "EMAIL_VERIFICATION_CONSUMED"
  | "EMAIL_VERIFICATION_EXPIRED"
  | "EMAIL_VERIFICATION_FAILED";
