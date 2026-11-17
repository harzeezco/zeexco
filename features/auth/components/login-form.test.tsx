import "@testing-library/jest-dom/vitest";
import { act, cleanup, render as renderComponent, screen, waitFor } from "@testing-library/react";
import { QueryProvider } from "@/lib/query-client";
import type { ReactElement } from "react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

const mocks = vi.hoisted(() => ({ login: vi.fn(), replace: vi.fn() }));
const render = (ui: ReactElement) => renderComponent(ui, { wrapper: QueryProvider });
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock("./session-provider", () => ({ useSession: () => ({ status: "anonymous" }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("../api/session", async (original) => ({ ...await original<typeof import("../api/session")>(), login: mocks.login }));

function apiError(status: number, code: string, message: string, headers = {}) {
  return new AxiosError("Request failed", undefined, undefined, undefined, { status, headers, data: { error: { code, message } } } as AxiosResponse);
}
beforeEach(() => { vi.clearAllMocks(); mocks.login.mockReset(); });
afterEach(cleanup);
async function fill() {
  await userEvent.type(screen.getByLabelText("Email address"), "Merchant@example.com");
  await userEvent.type(screen.getByLabelText("Password"), " simple ");
}

describe("login screen", () => {
  it("validates missing inputs without submitting", async () => {
    render(<LoginForm />);
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(mocks.login).not.toHaveBeenCalled();
  });
  it("waits for login and refresh completion, prevents duplicate submissions, then navigates", async () => {
    let finish!: (value: unknown) => void;
    mocks.login.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    render(<LoginForm />);
    await fill();
    const submit = screen.getByRole("button", { name: "Log in" });
    await userEvent.dblClick(submit);
    expect(mocks.login).toHaveBeenCalledExactlyOnceWith("merchant@example.com", " simple ");
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(submit).toBeDisabled();
    await act(async () => finish({ status_code: 200, message: "Welcome back" }));
    expect(mocks.replace).toHaveBeenCalledWith("/account");
  });
  it("shows invalid credentials without guessing which credential failed", async () => {
    mocks.login.mockRejectedValue(apiError(401, "INVALID_CREDENTIALS", "email or password is invalid"));
    render(<LoginForm />);
    await fill();
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("email or password is invalid");
    expect(screen.getByLabelText("Email address")).toHaveValue("Merchant@example.com");
    expect(mocks.replace).not.toHaveBeenCalled();
  });
  it("shows a check-email state without resending or authenticating a pending account", async () => {
    mocks.login.mockRejectedValue(apiError(403, "EMAIL_VERIFICATION_REQUIRED", "Please verify your email"));
    render(<LoginForm />);
    await fill();
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("heading", { name: "Check your email" })).toBeInTheDocument();
    expect(screen.getByText("merchant@example.com")).toBeInTheDocument();
    expect(mocks.login).toHaveBeenCalledTimes(1);
    expect(mocks.replace).not.toHaveBeenCalled();
  });
  it("disables retries for the readable Retry-After period", async () => {
    mocks.login.mockRejectedValue(apiError(429, "RATE_LIMITED", "too many requests; retry later", { "retry-after": "30" }));
    render(<LoginForm />);
    await fill();
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Try again in 30 seconds");
    expect(screen.getByRole("button", { name: "Log in" })).toBeDisabled();
  });
  it.each([new AxiosError("Network Error"), apiError(500, "REFRESH_FAILED", "session refresh could not be completed")])("keeps recoverable failures on login", async (error) => {
    mocks.login.mockRejectedValue(error);
    render(<LoginForm />);
    await fill();
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(screen.queryByText("email or password is invalid")).not.toBeInTheDocument();
  });
});
