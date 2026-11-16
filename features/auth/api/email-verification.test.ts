import { AxiosError, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api-client";
import { parseVerificationError, verifyEmail } from "./email-verification";

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
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ status: 204, data: undefined });
    await expect(verifyEmail("opaque-signed-token")).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledWith("/api/v1/auth/verify-email", { token: "opaque-signed-token" });
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
    expect(parseVerificationError(new AxiosError("Network Error"))).toBe("network");
  });
});
