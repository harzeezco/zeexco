import { AxiosError, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api-client";
import {
  parseVerificationError,
  verifyEmail,
  safeWhatsAppDestination,
} from "./email-verification";

function apiError(status: number, code: string) {
  return new AxiosError("Request failed", code, undefined, undefined, {
    status,
    data: { error: { code } },
    headers: {},
    config: { headers: {} },
    statusText: "Error",
  } as AxiosResponse);
}

describe("email verification API", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("posts exactly the token and accepts an empty 204 response", async () => {
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue({ status: 204, data: undefined });
    await expect(verifyEmail("opaque-signed-token")).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledWith("/api/v1/auth/verify-email", {
      token: "opaque-signed-token",
    });
  });

  it.each([
    [400, "EMAIL_VERIFICATION_INVALID", "invalid"],
    [409, "EMAIL_VERIFICATION_CONSUMED", "consumed"],
    [410, "EMAIL_VERIFICATION_EXPIRED", "expired"],
    [500, "EMAIL_VERIFICATION_FAILED", "server"],
  ] as const)("maps HTTP %s to %s", (status, code, expected) => {
    expect(parseVerificationError(apiError(status, code))).toBe(expected);
  });

  it("treats a connection failure as retryable network state", () => {
    expect(parseVerificationError(new AxiosError("Network Error"))).toBe(
      "network",
    );
  });

  it("accepts the WhatsApp activation response without logging in", async () => {
    const data = {
      status_code: 200,
      message: "Activated",
      next_step: "CONTINUE_IN_WHATSAPP",
      redirect_url: "https://wa.me/15550001234?text=Continue",
    };
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue({ status: 200, data });
    await expect(verifyEmail("signed-email-token")).resolves.toEqual({
      next_step: "CONTINUE_IN_WHATSAPP",
      redirect_url: data.redirect_url,
    });
    expect(post).toHaveBeenCalledExactlyOnceWith("/api/v1/auth/verify-email", {
      token: "signed-email-token",
    });
  });

  it.each([
    "javascript:alert(1)",
    "http://wa.me/15550001234",
    "https://wa.me.evil.test/15550001234",
    "https://evil.test/15550001234",
    "https://user@wa.me/15550001234",
    "https://wa.me:444/15550001234",
    "https://wa.me/redirect",
    "/15550001234",
    undefined,
  ])("rejects unsafe WhatsApp destination %s", (value) => {
    expect(safeWhatsAppDestination(value)).toBeNull();
  });
});
