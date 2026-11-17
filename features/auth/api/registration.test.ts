import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api-client";
import { registerWebMerchant } from "./registration";

describe("registration API", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("uses the web registration endpoint", async () => {
    const response = {
      status_code: 202,
      message:
        "Registration successful. Please check your email to activate your account.",
    };
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue({ data: response, status: 202 });
    const payload = {
      first_name: "Wakil",
      last_name: "Azeez",
      business_name: "Wakil Stores",
      email: "wakil@example.com",
      password: "password1234",
    };
    expect(await registerWebMerchant(payload)).toEqual(response);
    expect(post).toHaveBeenCalledWith("/api/v1/auth/register", payload);
  });
});
