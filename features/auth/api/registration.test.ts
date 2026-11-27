import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api-client";
import {
  registerWebMerchant,
  requestWhatsAppOTP,
  verifyWhatsAppOTP,
} from "./registration";
describe("registration API", () => {
  beforeEach(() => vi.restoreAllMocks());
  it("sends only supported fields and exactly one proof", async () => {
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue({ data: {}, status: 201 });
    await registerWebMerchant({
      first_name: "Ada",
      last_name: "Obi",
      business_name: "Stores",
      email: "",
      registration_challenge_token: "proof",
      password: "discard",
    } as Parameters<typeof registerWebMerchant>[0]);
    expect(post).toHaveBeenCalledWith("/api/v1/auth/register", {
      first_name: "Ada",
      last_name: "Obi",
      business_name: "Stores",
      registration_challenge_token: "proof",
    });
    expect(apiClient.defaults.withCredentials).toBe(true);
  });
  it("requests a challenge and preserves leading-zero OTPs", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ data: {} });
    await requestWhatsAppOTP("+2348012345678");
    await verifyWhatsAppOTP("challenge", "012345");
    expect(post).toHaveBeenNthCalledWith(
      1,
      "/api/v1/auth/whatsapp-otp/request",
      { whatsapp_number: "+2348012345678" },
    );
    expect(post).toHaveBeenNthCalledWith(
      2,
      "/api/v1/auth/whatsapp-otp/verify",
      { challenge_id: "challenge", otp: "012345" },
    );
  });
});
