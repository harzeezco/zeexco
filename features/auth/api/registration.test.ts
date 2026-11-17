import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api-client";
import { registerWebMerchant, registerWhatsAppMerchant, validateWhatsAppOnboarding } from "./registration";

describe("registration API", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("uses the web registration endpoint", async () => {
    const response = { status_code: 202, message: "Registration successful. Please check your email to activate your account." };
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ data: response, status: 202 });
    const payload = { first_name: "Wakil", last_name: "Azeez", business_name: "Wakil Stores", email: "wakil@example.com", password: "password1234" };
    expect(await registerWebMerchant(payload)).toEqual(response);
    expect(post).toHaveBeenCalledWith("/api/v1/auth/register", payload);
  });

  it("uses the WhatsApp endpoints", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue({ data: { valid: true } });
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ data: {} });
    await validateWhatsAppOnboarding("opaque-token");
    const payload = { first_name: "Wakil", last_name: "Azeez", business_name: "Wakil Stores", onboarding_token: "opaque-token" };
    await registerWhatsAppMerchant(payload);
    expect(get).toHaveBeenCalledWith("/api/v1/whatsapp/onboarding/validate", { params: { token: "opaque-token" } });
    expect(post).toHaveBeenCalledWith("/api/v1/whatsapp/onboarding/register", payload);
  });
});
