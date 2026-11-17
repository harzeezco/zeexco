import "@testing-library/jest-dom/vitest";
import { cleanup, render as renderComponent, screen, waitFor } from "@testing-library/react";
import { QueryProvider } from "@/lib/query-client";
import type { ReactElement } from "react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmailVerification } from "./email-verification";

const verification = vi.hoisted(() => ({ verify: vi.fn(), parse: vi.fn() }));

const render = (ui: ReactElement) => renderComponent(ui, { wrapper: QueryProvider });

vi.mock("../api/email-verification", async (original) => ({
  ...await original<typeof import("../api/email-verification")>(),
  parseVerificationError: verification.parse,
}));

vi.mock("@/lib/api-client", () => ({
  apiClient: { post: (...args: unknown[]) => verification.verify(...args).then(() => ({ status: 204 })) },
  normalizeApiError: vi.fn(),
}));

describe("email verification screen", () => {
  beforeEach(() => {
    verification.verify.mockReset();
    verification.parse.mockReset();
    window.history.replaceState({}, "", "/verify-email");
  });
  afterEach(cleanup);

  it("shows an invalid-link state when the token is missing", () => {
    render(<EmailVerification />);
    expect(screen.getByRole("heading", { name: "This verification link is invalid." })).toBeInTheDocument();
    expect(verification.verify).not.toHaveBeenCalled();
  });

  it("submits once in Strict Mode, removes the token URL, and shows login after 204", async () => {
    window.history.replaceState({}, "", "/verify-email?token=do-not-persist");
    verification.verify.mockResolvedValue(undefined);
    render(<StrictMode><EmailVerification token="opaque-signed-token" /></StrictMode>);
    expect(await screen.findByRole("heading", { name: "Your account is complete" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    expect(verification.verify).toHaveBeenCalledTimes(1);
    expect(verification.verify.mock.calls[0][1]).toEqual({ token: "opaque-signed-token" });
    expect(window.location.search).toBe("");
  });

  it.each([
    ["invalid", "This verification link is invalid."],
    ["consumed", "This link has already been used."],
    ["expired", "This verification link has expired."],
  ])("shows the %s terminal state", async (failure, heading) => {
    verification.verify.mockRejectedValue(new Error("redacted"));
    verification.parse.mockReturnValue(failure);
    render(<EmailVerification token="opaque" />);
    expect(await screen.findByRole("heading", { name: heading })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    if (failure === "consumed") expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument();
  });

  it.each(["server", "network"])("allows one controlled retry after a %s failure", async (failure) => {
    verification.verify.mockRejectedValueOnce(new Error("redacted")).mockResolvedValueOnce(undefined);
    verification.parse.mockReturnValue(failure);
    render(<EmailVerification token="opaque" />);
    const retry = await screen.findByRole("button", { name: "Try again" });
    await userEvent.click(retry);
    await userEvent.click(retry);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Your account is complete" })).toBeInTheDocument());
    expect(verification.verify).toHaveBeenCalledTimes(2);
  });
});

