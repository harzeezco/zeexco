import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { normalizeApiError } from "./api-client";

describe("normalizeApiError", () => {
  it("reads the backend nested error contract", () => {
    const response = {
      data: { error: { code: "EMAIL_ALREADY_REGISTERED", message: "Email is already registered.", field: "email" } },
      status: 409,
      statusText: "Conflict",
      headers: {},
      config: { headers: {} },
    } as AxiosResponse;
    const result = normalizeApiError(new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, response));
    expect(result).toMatchObject({
      error_code: "EMAIL_ALREADY_REGISTERED",
      message: "Email is already registered.",
      field: "email",
    });
  });
});
