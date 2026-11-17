import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api-client";
import { QueryProvider } from "@/lib/query-client";
import { WhatsAppRegistrationFlow } from "./whatsapp-registration-flow";
import { WebRegistrationForm } from "./web-registration-form";
import {
  RegistrationSuccess,
  saveRegistrationConfirmation,
} from "./registration-success";
import { sessionStore } from "../api/session";

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const renderFlow = (token: string | null) =>
  render(
    <StrictMode>
      <WhatsAppRegistrationFlow token={token} />
    </StrictMode>,
    { wrapper: QueryProvider },
  );
function error(status: number, code: string, field?: string, headers = {}) {
  return new AxiosError("Request failed", undefined, undefined, undefined, {
    status,
    headers,
    data: { error: { code, message: "Backend validation message", field } },
  } as AxiosResponse);
}
async function fill() {
  const user = userEvent.setup();
  await screen.findByLabelText("First name");
  for (const [label, value] of [
    ["First name", "Ada"],
    ["Last name", "Lovelace"],
    ["Business name", "Ada Store"],
    ["Email address", "ada@example.com"],
    ["Password", " Securepass1! "],
  ]) {
    await user.click(screen.getByLabelText(label));
    await user.paste(value);
  }
}
beforeEach(() => {
  vi.restoreAllMocks();
  navigation.replace.mockReset();
  sessionStorage.clear();
  localStorage.clear();
});
afterEach(cleanup);

describe("WhatsApp browser signup", () => {
  it("does not enable or render the form until token validation succeeds", async () => {
    let finish!: (value: unknown) => void;
    const get = vi.spyOn(apiClient, "get").mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderFlow("opaque/+?&=token");
    expect(screen.getByRole("status")).toHaveTextContent("Please wait");
    expect(
      screen.queryByRole("button", { name: "Create account" }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    expect(get).toHaveBeenCalledWith("/api/v1/whatsapp/onboarding/validate", {
      params: { token: "opaque/+?&=token" },
    });
    await act(async () => finish({ data: { valid: true, status: "PENDING" } }));
    expect(
      await screen.findByRole("button", { name: "Create account" }),
    ).toBeEnabled();
  });

  it("rejects a missing token without a validation request", () => {
    const get = vi.spyOn(apiClient, "get");
    renderFlow(null);
    expect(
      screen.getByRole("heading", { name: "Invalid registration link" }),
    ).toBeInTheDocument();
    expect(get).not.toHaveBeenCalled();
  });

  it.each([
    [400, "ONBOARDING_TOKEN_REQUIRED", "Invalid registration link"],
    [400, "ONBOARDING_TOKEN_INVALID", "Invalid registration link"],
    [404, "ONBOARDING_TOKEN_INVALID", "Invalid registration link"],
    [410, "ONBOARDING_TOKEN_EXPIRED", "This link has expired"],
    [409, "ONBOARDING_TOKEN_CONSUMED", "This link has already been used"],
    [409, "ONBOARDING_VERIFICATION_PENDING", "Check your email"],
  ])(
    "handles validation %s %s without showing a form",
    async (status, code, heading) => {
      vi.spyOn(apiClient, "get").mockRejectedValue(
        error(status as number, code as string),
      );
      const post = vi.spyOn(apiClient, "post");
      renderFlow("opaque");
      expect(
        await screen.findByRole("heading", { name: heading as string }),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
      expect(post).not.toHaveBeenCalled();
    },
  );

  it.each([new AxiosError("Network Error"), error(500, "LOOKUP_FAILED")])(
    "allows an explicit retry for recoverable validation failures",
    async (failure) => {
      const get = vi
        .spyOn(apiClient, "get")
        .mockRejectedValueOnce(failure)
        .mockResolvedValueOnce({ data: { valid: true, status: "PENDING" } });
      renderFlow("opaque");
      await userEvent.click(
        await screen.findByRole("button", { name: "Try again" }),
      );
      expect(await screen.findByLabelText("Password")).toBeInTheDocument();
      expect(get).toHaveBeenCalledTimes(2);
    },
  );

  it("respects Retry-After without automatically retrying validation", async () => {
    const get = vi
      .spyOn(apiClient, "get")
      .mockRejectedValue(
        error(429, "RATE_LIMITED", undefined, { "retry-after": "30" }),
      );
    renderFlow("opaque");
    expect(
      await screen.findByText("Try again in 30 seconds."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeDisabled();
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("submits one dedicated WhatsApp request with the exact token and password and stores no secrets", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: { valid: true, status: "PENDING" },
    });
    let finish!: (value: unknown) => void;
    const post = vi.spyOn(apiClient, "post").mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const log = vi.spyOn(console, "log");
    const initialSession = sessionStore.getSnapshot();
    renderFlow(" opaque-token/+?= ");
    await fill();
    await userEvent.dblClick(
      screen.getByRole("button", { name: "Create account" }),
    );
    expect(post).toHaveBeenCalledExactlyOnceWith(
      "/api/v1/whatsapp/onboarding/register",
      {
        first_name: "Ada",
        last_name: "Lovelace",
        business_name: "Ada Store",
        email: "ada@example.com",
        password: " Securepass1! ",
        onboarding_token: " opaque-token/+?= ",
      },
    );
    expect(
      screen.getByRole("button", { name: "Creating account..." }),
    ).toBeDisabled();
    await act(async () =>
      finish({
        status: 202,
        data: {
          status_code: 202,
          message: "Check your email to activate your account.",
        },
      }),
    );
    expect(
      await screen.findByRole("heading", { name: "Check your email" }),
    ).toBeInTheDocument();
    expect(navigation.replace).toHaveBeenCalledWith("/register/success");
    const saved = sessionStorage.getItem("zico-registration-confirmation")!;
    expect(saved).not.toContain("opaque-token");
    expect(saved).not.toContain("Securepass1!");
    expect(saved).not.toContain("onboarding_token");
    expect(localStorage.length).toBe(0);
    expect(log).not.toHaveBeenCalled();
    expect(sessionStore.getSnapshot()).toBe(initialSession);
    expect(
      screen.queryByRole("link", { name: "Continue in WhatsApp" }),
    ).not.toBeInTheDocument();
  });

  it("preserves the token while correcting field errors", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: { valid: true, status: "PENDING" },
    });
    const post = vi
      .spyOn(apiClient, "post")
      .mockRejectedValueOnce(error(400, "VALIDATION_ERROR", "business_name"))
      .mockResolvedValueOnce({
        status: 202,
        data: { status_code: 202, message: "Check email" },
      });
    renderFlow("unchanged-token");
    await fill();
    await userEvent.click(
      screen.getByRole("button", { name: "Create account" }),
    );
    expect(
      (await screen.findAllByText("Backend validation message")).length,
    ).toBeGreaterThan(0);
    await userEvent.type(screen.getByLabelText("Business name"), " Updated");
    await userEvent.click(
      screen.getByRole("button", { name: "Create account" }),
    );
    await screen.findByRole("heading", { name: "Check your email" });
    expect(post.mock.calls[1][1]).toMatchObject({
      onboarding_token: "unchanged-token",
      password: " Securepass1! ",
    });
  });

  it.each([
    "ONBOARDING_TOKEN_INVALID",
    "ONBOARDING_TOKEN_EXPIRED",
    "ONBOARDING_TOKEN_CONSUMED",
  ])("stops registration after %s", async (code) => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: { valid: true, status: "PENDING" },
    });
    const post = vi
      .spyOn(apiClient, "post")
      .mockRejectedValue(error(409, code));
    renderFlow("opaque");
    await fill();
    await userEvent.click(
      screen.getByRole("button", { name: "Create account" }),
    );
    await waitFor(() =>
      expect(screen.queryByLabelText("Password")).not.toBeInTheDocument(),
    );
    expect(post).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: "Try again" }),
    ).not.toBeInTheDocument();
  });

  it("offers login guidance without linking an existing account", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: { valid: true, status: "PENDING" },
    });
    const post = vi
      .spyOn(apiClient, "post")
      .mockRejectedValue(error(409, "EMAIL_ALREADY_REGISTERED"));
    renderFlow("opaque");
    await fill();
    await userEvent.click(
      screen.getByRole("button", { name: "Create account" }),
    );
    expect(
      await screen.findByText(/requires a separate linking flow/),
    ).toBeInTheDocument();
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("keeps ordinary registration free of onboarding identity fields", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({
      status: 202,
      data: { status_code: 202, message: "Check email" },
    });
    render(<WebRegistrationForm />, { wrapper: QueryProvider });
    await fill();
    await userEvent.click(
      screen.getByRole("button", { name: "Create account" }),
    );
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(Object.keys(post.mock.calls[0][1] as object)).toEqual([
      "first_name",
      "last_name",
      "business_name",
      "email",
      "password",
    ]);
  });

  it("persists only confirmation fields and never resubmits from Check your email", () => {
    const post = vi.spyOn(apiClient, "post");
    saveRegistrationConfirmation({
      email: "ada@example.com",
      message: "Check email",
      whatsapp: true,
      password: "secret",
      onboarding_token: "secret-token",
    } as Parameters<typeof saveRegistrationConfirmation>[0]);
    render(<RegistrationSuccess />);
    expect(
      JSON.parse(sessionStorage.getItem("zico-registration-confirmation")!),
    ).toEqual({
      email: "ada@example.com",
      message: "Check email",
      whatsapp: true,
    });
    expect(post).not.toHaveBeenCalled();
  });

  it.each([
    new AxiosError("Network Error"),
    error(500, "UNAVAILABLE"),
    error(429, "RATE_LIMITED", undefined, { "retry-after": "20" }),
  ])(
    "keeps registration failures recoverable without automatic resubmission",
    async (failure) => {
      vi.spyOn(apiClient, "get").mockResolvedValue({
        data: { valid: true, status: "PENDING" },
      });
      const post = vi.spyOn(apiClient, "post").mockRejectedValue(failure);
      renderFlow("opaque");
      await fill();
      await userEvent.click(
        screen.getByRole("button", { name: "Create account" }),
      );
      await screen.findByRole("alert");
      expect(screen.getByLabelText("Password")).toHaveValue(" Securepass1! ");
      expect(post).toHaveBeenCalledTimes(1);
      expect(navigation.replace).not.toHaveBeenCalled();
      if (failure.response?.status === 429) {
        expect(
          screen.getByRole("button", { name: "Create account" }),
        ).toBeDisabled();
        expect(screen.getByRole("status")).toHaveTextContent(
          "Try again in 20 seconds",
        );
      }
    },
  );

  it("shows confirmation and removes the token URL when browser storage is blocked", async () => {
    window.history.replaceState({}, "", "/register?token=private-onboarding");
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: { valid: true, status: "PENDING" },
    });
    vi.spyOn(apiClient, "post").mockResolvedValue({
      status: 202,
      data: { status_code: 202, message: "Check email" },
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    renderFlow("private-onboarding");
    await fill();
    await userEvent.click(
      screen.getByRole("button", { name: "Create account" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Check your email" }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/register/success");
    expect(window.location.search).toBe("");
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
