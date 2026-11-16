import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WebRegistrationForm } from "./web-registration-form";
import { WhatsAppRegistrationFlow } from "./whatsapp-registration-flow";
import { RegistrationSuccess, saveRegistrationConfirmation } from "./registration-success";

const webMutate = vi.fn();
const whatsappMutate = vi.fn();
const refetch = vi.fn();
const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
let webState: Record<string, unknown>;

afterEach(cleanup);

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  useSearchParams: () => ({ get: (key: string) => key === "token" ? "secret-onboarding-token" : null }),
}));

vi.mock("../api/registration", () => ({
  useRegisterWebMerchant: () => ({ mutate: webMutate, isPending: false, isError: false, isSuccess: false, ...webState }),
  useRegisterWhatsAppMerchant: () => ({ mutate: whatsappMutate, isPending: false, isError: false, isSuccess: false }),
  useValidateWhatsAppOnboarding: () => ({ data: { valid: true, status: "PENDING" }, isPending: false, isError: false, refetch }),
  parseRegistrationError: () => "Registration failed.",
  parseOnboardingError: () => ({ message: "Registration failed.", retryable: true }),
}));

describe("registration flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    webState = {};
  });

  it("does not claim success when the confirmation route is opened without registration", () => {
    render(<RegistrationSuccess />);
    expect(screen.queryByText("Registration successful")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to registration" })).toHaveAttribute("href", "/register");
  });

  it("preserves the response message and email on the confirmation route", () => {
    saveRegistrationConfirmation({ email: "merchant@example.com", message: "Your registration is complete. Please verify your email." });
    render(<RegistrationSuccess />);
    expect(screen.getByRole("heading", { name: "Check your email" })).toBeInTheDocument();
    expect(screen.getByText("merchant@example.com")).toBeInTheDocument();
    expect(screen.getByText("Your registration is complete. Please verify your email.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to login" })).toHaveAttribute("href", "/login");
  });

  it("shows the check-email screen for a pending registration without authenticating", () => {
    webState = {
      isSuccess: true,
      data: {
        user: { email: "wakil@example.com", status: "PENDING" },
        business: { status: "PENDING" },
        next_step: "VERIFY_EMAIL",
      },
    };
    render(<WebRegistrationForm />);
    expect(screen.getByRole("heading", { name: "Check your email" })).toBeInTheDocument();
    expect(screen.getByText("wakil@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to login" })).toHaveAttribute("href", "/login");
    expect(webMutate).not.toHaveBeenCalled();
    expect(screen.queryByText(/account is ready/i)).not.toBeInTheDocument();
  });

  it("renders the separate web registration fields and validates required values", async () => {
    render(<WebRegistrationForm />);
    expect(screen.getByRole("heading", { name: "Create your Zico account" })).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.queryByLabelText("Confirm password")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("First name is required")).toBeInTheDocument();
    expect(screen.getByText("Last name is required")).toBeInTheDocument();
    expect(screen.getByText("Business name is required")).toBeInTheDocument();
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("submits web registration without a token or confirm password", async () => {
    render(<WebRegistrationForm />);
    await userEvent.type(screen.getByLabelText("First name"), "Wakil");
    await userEvent.type(screen.getByLabelText("Last name"), "Azeez");
    await userEvent.type(screen.getByLabelText("Business name"), "Wakil Stores");
    await userEvent.type(screen.getByLabelText("Email address"), "wakil@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password1234!");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(webMutate).toHaveBeenCalledWith({ first_name: "Wakil", last_name: "Azeez", business_name: "Wakil Stores", email: "wakil@example.com", password: "password1234!" }, expect.any(Object));
    const callbacks = webMutate.mock.calls[0][1];
    act(() => callbacks.onSuccess({ status_code: 200, message: "Account created successfully" }));
    expect(navigation.replace).toHaveBeenCalledWith("/register/success");
    expect(JSON.parse(sessionStorage.getItem("zico-registration-confirmation")!)).toEqual({ email: "wakil@example.com", message: "Account created successfully" });
    expect(sessionStorage.getItem("zico-registration-confirmation")).not.toContain("password1234!");
    act(() => callbacks.onError(new Error("Registration service unavailable")));
    expect(toast.error).toHaveBeenCalledWith("Registration service unavailable");
  });

  it("updates password errors while typing and clears them once all requirements are met", async () => {
    render(<WebRegistrationForm />);
    const password = screen.getByLabelText("Password");
    await userEvent.type(password, "password");
    expect(await screen.findByText("Password must contain at least one number")).toBeInTheDocument();
    await userEvent.type(password, "1");
    expect(await screen.findByText("Password must contain at least one symbol")).toBeInTheDocument();
    await userEvent.type(password, "!");
    expect(screen.queryByText("Password must contain at least one symbol")).not.toBeInTheDocument();
    expect(password).toHaveAttribute("aria-invalid", "false");
  });

  it("toggles password visibility without submitting the form", async () => {
    render(<WebRegistrationForm />);
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    expect(webMutate).not.toHaveBeenCalled();
  });

  it("shows a lighter WhatsApp form and omits an empty optional email", async () => {
    render(<WhatsAppRegistrationFlow />);
    expect(screen.getByLabelText("Email (optional)")).toBeInTheDocument();
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
    expect(screen.queryByText("secret-onboarding-token")).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("First name"), "Wakil");
    await userEvent.type(screen.getByLabelText("Last name"), "Azeez");
    await userEvent.type(screen.getByLabelText("Business name"), "Wakil Stores");
    await userEvent.click(screen.getByRole("button", { name: "Create my business" }));
    expect(whatsappMutate).toHaveBeenCalledWith({ first_name: "Wakil", last_name: "Azeez", business_name: "Wakil Stores", onboarding_token: "secret-onboarding-token" });
  });
});
