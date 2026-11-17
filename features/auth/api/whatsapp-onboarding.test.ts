import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api-client";
import {
  registerWhatsAppMerchant,
  validateWhatsAppOnboarding,
} from "./whatsapp-onboarding";

describe("WhatsApp onboarding API", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("validates the exact opaque token without identity fields", async () => {
    const get = vi
      .spyOn(apiClient, "get")
      .mockResolvedValue({ data: { valid: true, status: "PENDING" } });
    await validateWhatsAppOnboarding("opaque/+?&=");
    expect(get).toHaveBeenCalledExactlyOnceWith(
      "/api/v1/whatsapp/onboarding/validate",
      { params: { token: "opaque/+?&=" } },
    );
  });

  it("uses only the dedicated registration endpoint and accepts status/message", async () => {
    const data = { status_code: 202, message: "Check your email" };
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue({ status: 202, data });
    const payload = {
      first_name: "Ada",
      last_name: "Lovelace",
      business_name: "Ada Store",
      email: "ada@example.com",
      password: " Securepass1! ",
      onboarding_token: "opaque",
    };
    expect(await registerWhatsAppMerchant(payload)).toEqual(data);
    expect(post).toHaveBeenCalledExactlyOnceWith(
      "/api/v1/whatsapp/onboarding/register",
      payload,
    );
  });
});
