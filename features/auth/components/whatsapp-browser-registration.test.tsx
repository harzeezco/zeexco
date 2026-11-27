import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api-client";
import { QueryProvider } from "@/lib/query-client";
import { WhatsAppRegistrationFlow } from "./whatsapp-registration-flow";
import { WebRegistrationForm } from "./web-registration-form";
import {
  authenticatedApiClient,
  clearSession,
  sessionStore,
} from "../api/session";
const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
function failure(code: string, status = 400, headers = {}) {
  return new AxiosError("Request failed", undefined, undefined, undefined, {
    status,
    headers,
    data: { error: { code, message: "Backend message" } },
  } as AxiosResponse);
}
const session = {
  user: { id: "user", first_name: "Ada", last_name: "Obi", status: "ACTIVE" },
  businesses: [
    {
      id: "business",
      name: "Stores",
      status: "ACTIVE",
      membership_role: "OWNER",
    },
  ],
};
const registered = {
  user: session.user,
  business: session.businesses[0],
  next_step: "ADD_FIRST_PRODUCT",
};
const challenge = (id = "challenge", expiry = Date.now() + 300000) => ({
  challenge_id: id,
  expires_at: new Date(expiry).toISOString(),
  message: "Requested",
});
async function profile(email = "") {
  await screen.findByLabelText("First name");
  for (const [label, value] of [
    ["First name", "  Ada  "],
    ["Last name", "Obi"],
    ["Business name", "Stores"],
    ["Email address (optional)", email],
  ])
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
async function number() {
  fireEvent.change(screen.getByLabelText("WhatsApp number"), {
    target: { value: "+2348012345678" },
  });
  await userEvent.click(screen.getByRole("button", { name: "Request code" }));
  await screen.findByLabelText("Verification code");
}
async function verify() {
  const user = userEvent.setup();
  await user.click(screen.getByLabelText("Verification code"));
  await user.paste("012345");
  await user.keyboard("{Enter}");
  await screen.findByLabelText("First name");
}
const invite = (token: string | null = "invitation") =>
  render(<WhatsAppRegistrationFlow token={token} />, {
    wrapper: QueryProvider,
  });
beforeEach(() => {
  vi.restoreAllMocks();
  navigation.replace.mockReset();
  clearSession();
  sessionStorage.clear();
  localStorage.clear();
  vi.spyOn(authenticatedApiClient, "get").mockResolvedValue({ data: session });
  vi.spyOn(apiClient, "get").mockResolvedValue({
    data: { valid: true, status: "PENDING" },
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
describe("registration journeys", () => {
  it("verifies a pasted leading-zero OTP, creates a profile without email, and loads real memberships", async () => {
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValueOnce({ data: challenge() })
      .mockResolvedValueOnce({
        data: { registration_challenge_token: "proof" },
      })
      .mockResolvedValueOnce({ status: 201, data: registered });
    render(<WebRegistrationForm />, { wrapper: QueryProvider });
    await number();
    await verify();
    expect(sessionStore.getSnapshot().status).toBe("anonymous");
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
    await profile();
    await userEvent.dblClick(
      screen.getByRole("button", { name: "Create account" }),
    );
    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith("/account"),
    );
    expect(post).toHaveBeenNthCalledWith(
      2,
      "/api/v1/auth/whatsapp-otp/verify",
      { challenge_id: "challenge", otp: "012345" },
    );
    expect(post).toHaveBeenNthCalledWith(3, "/api/v1/auth/register", {
      first_name: "Ada",
      last_name: "Obi",
      business_name: "Stores",
      registration_challenge_token: "proof",
    });
    expect(post).toHaveBeenCalledTimes(3);
    expect(
      sessionStore.getSnapshot().session?.businesses[0].membership_role,
    ).toBe("OWNER");
    expect(localStorage.length + sessionStorage.length).toBe(0);
  });
  it("validates an invitation, strips its URL, and submits exactly the invitation proof", async () => {
    window.history.replaceState({}, "", "/register?token=invitation");
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue({ status: 201, data: registered });
    invite();
    await profile(" ADA@EXAMPLE.COM ");
    expect(window.location.search).toBe("");
    await userEvent.click(
      screen.getByRole("button", { name: "Create account" }),
    );
    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith("/account"),
    );
    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/v1/whatsapp/onboarding/validate",
      { params: { token: "invitation" } },
    );
    expect(post).toHaveBeenCalledExactlyOnceWith("/api/v1/auth/register", {
      first_name: "Ada",
      last_name: "Obi",
      business_name: "Stores",
      email: "ada@example.com",
      onboarding_token: "invitation",
    });
  });
  it.each([
    failure("SESSION_LOOKUP_FAILED", 500),
    failure("INVALID_REFRESH_SESSION", 401),
  ])(
    "retries only session loading after successful registration",
    async (error) => {
      const post = vi
        .spyOn(apiClient, "post")
        .mockResolvedValue({ status: 201, data: registered });
      vi.mocked(authenticatedApiClient.get)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ data: session });
      invite();
      await profile();
      await userEvent.click(
        screen.getByRole("button", { name: "Create account" }),
      );
      await userEvent.click(
        await screen.findByRole("button", { name: "Retry session" }),
      );
      await waitFor(() =>
        expect(navigation.replace).toHaveBeenCalledWith("/account"),
      );
      expect(post).toHaveBeenCalledTimes(1);
      expect(authenticatedApiClient.get).toHaveBeenCalledTimes(2);
    },
  );
  it("validates required names and preserves profile input after an account conflict", async () => {
    const post = vi
      .spyOn(apiClient, "post")
      .mockRejectedValue(failure("ACCOUNT_CONFLICT", 409));
    invite();
    await screen.findByLabelText("First name");
    await userEvent.click(
      screen.getByRole("button", { name: "Create account" }),
    );
    expect(
      await screen.findByText("First name is required"),
    ).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
    await profile();
    await userEvent.click(
      screen.getByRole("button", { name: "Create account" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Backend message",
    );
    expect(screen.getByLabelText("Business name")).toHaveValue("Stores");
  });
  it("restarts verification when a direct proof expires", async () => {
    vi.spyOn(apiClient, "post")
      .mockResolvedValueOnce({ data: challenge() })
      .mockResolvedValueOnce({
        data: { registration_challenge_token: "old-proof" },
      })
      .mockRejectedValueOnce(failure("REGISTRATION_PROOF_INVALID"));
    render(<WebRegistrationForm />, { wrapper: QueryProvider });
    await number();
    await verify();
    await profile();
    await userEvent.click(
      screen.getByRole("button", { name: "Create account" }),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Restart verification" }),
    );
    expect(screen.getByLabelText("WhatsApp number")).toBeInTheDocument();
    expect(screen.queryByLabelText("First name")).not.toBeInTheDocument();
  });
  it("replaces a challenge and clears the old OTP on resend, and changing number clears verification", async () => {
    let clock = Date.now();
    vi.spyOn(Date, "now").mockImplementation(() => clock);
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValueOnce({ data: challenge("first") })
      .mockResolvedValueOnce({ data: challenge("second") })
      .mockResolvedValueOnce({
        data: { registration_challenge_token: "proof" },
      });
    render(<WebRegistrationForm />, { wrapper: QueryProvider });
    await number();
    fireEvent.change(screen.getByLabelText("Verification code"), {
      target: { value: "999999" },
    });
    expect(
      screen.getByRole("button", { name: /Resend code in/ }),
    ).toBeDisabled();
    clock += 61000;
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Resend code" })).toBeEnabled(),
    );
    await userEvent.click(screen.getByRole("button", { name: "Resend code" }));
    expect(await screen.findByLabelText("Verification code")).toHaveValue("");
    await userEvent.click(
      screen.getByRole("button", { name: "Change number" }),
    );
    expect(
      screen.queryByLabelText("Verification code"),
    ).not.toBeInTheDocument();
    clock += 61000;
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Request code" }),
      ).toBeEnabled(),
    );
    // Request again after changing the number; no OTP/proof survives.
    post
      .mockReset()
      .mockResolvedValueOnce({ data: challenge("third") })
      .mockResolvedValueOnce({
        data: { registration_challenge_token: "proof" },
      });
    await number();
    expect(screen.getByLabelText("Verification code")).toHaveValue("");
    await verify();
    expect(post).toHaveBeenLastCalledWith("/api/v1/auth/whatsapp-otp/verify", {
      challenge_id: "third",
      otp: "012345",
    });
  });
  it("uses expiry and honors Retry-After on OTP requests", async () => {
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValueOnce({ data: challenge("expired", Date.now() - 1000) });
    render(<WebRegistrationForm />, { wrapper: QueryProvider });
    await number();
    expect(screen.getByRole("button", { name: "Verify code" })).toBeDisabled();
    expect(screen.getByText(/This code has expired/)).toBeInTheDocument();
    cleanup();
    post.mockRejectedValue(
      failure("RATE_LIMITED", 429, { "retry-after": "120" }),
    );
    render(<WebRegistrationForm />, { wrapper: QueryProvider });
    fireEvent.change(screen.getByLabelText("WhatsApp number"), {
      target: { value: "+2348012345678" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Request code" }));
    expect(await screen.findByRole("status")).toHaveTextContent("120 seconds");
    expect(screen.getByRole("button", { name: "Request code" })).toBeDisabled();
  });
  it.each([
    "ONBOARDING_TOKEN_INVALID",
    "ONBOARDING_TOKEN_EXPIRED",
    "ONBOARDING_TOKEN_CONSUMED",
    "ONBOARDING_VERIFICATION_PENDING",
  ])("handles invitation validation error %s", async (code) => {
    vi.mocked(apiClient.get).mockRejectedValue(failure(code));
    invite();
    await waitFor(() =>
      expect(
        screen.queryByText(
          "Please wait while we check your WhatsApp registration link.",
        ),
      ).not.toBeInTheDocument(),
    );
    expect(screen.queryByLabelText("First name")).not.toBeInTheDocument();
    if (code === "ONBOARDING_VERIFICATION_PENDING")
      expect(screen.getByText("Backend message")).toBeInTheDocument();
  });
});
