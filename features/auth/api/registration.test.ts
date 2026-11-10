import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api-client";
import { registerWebMerchant, registerWhatsAppMerchant, validateWhatsAppOnboarding } from "./registration";

describe("registration API", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("uses the web registration endpoint", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ data: {} });
    const payload = { first_name: "Wakil", last_name: "Azeez", business_name: "Wakil Stores", email: "wakil@example.com", password: "password1234" };
    await registerWebMerchant(payload);
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
