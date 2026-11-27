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

  it("uses the shared registration endpoint", async () => {
    const data = {
      user: { id: "u" },
      business: { id: "b" },
      next_step: "ADD_FIRST_PRODUCT",
    };
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue({ status: 201, data });
    const payload = {
      first_name: "Ada",
      last_name: "Lovelace",
      business_name: "Ada Store",
      email: "ada@example.com",
      onboarding_token: "opaque",
    };
    expect(await registerWhatsAppMerchant(payload)).toEqual(data);
    expect(post).toHaveBeenCalledExactlyOnceWith(
      "/api/v1/auth/register",
      payload,
    );
  });
});
