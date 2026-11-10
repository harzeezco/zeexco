import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WebRegistrationForm } from "./web-registration-form";
import { WhatsAppRegistrationFlow } from "./whatsapp-registration-flow";

const webMutate = vi.fn();
const whatsappMutate = vi.fn();
const refetch = vi.fn();

afterEach(cleanup);

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: (key: string) => key === "token" ? "secret-onboarding-token" : null }),
}));

vi.mock("../api/registration", () => ({
  useRegisterWebMerchant: () => ({ mutate: webMutate, isPending: false, isError: false, isSuccess: false }),
  useRegisterWhatsAppMerchant: () => ({ mutate: whatsappMutate, isPending: false, isError: false, isSuccess: false }),
  useValidateWhatsAppOnboarding: () => ({ data: { valid: true, status: "PENDING" }, isPending: false, isError: false, refetch }),
  parseRegistrationError: () => "Registration failed.",
  parseOnboardingError: () => ({ message: "Registration failed.", retryable: true }),
}));

describe("registration flows", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the separate web registration fields and validates required values", async () => {
    render(<WebRegistrationForm />);
    expect(screen.getByRole("heading", { name: "Create your account" })).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("First name is required")).toBeInTheDocument();
    expect(screen.getByText("Last name is required")).toBeInTheDocument();
    expect(screen.getByText("Business name is required")).toBeInTheDocument();
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(screen.getByText("Confirm password is required")).toBeInTheDocument();
  });

  it("submits web registration without a token or confirm password", async () => {
    render(<WebRegistrationForm />);
    await userEvent.type(screen.getByLabelText("First name"), "Wakil");
    await userEvent.type(screen.getByLabelText("Last name"), "Azeez");
    await userEvent.type(screen.getByLabelText("Business name"), "Wakil Stores");
    await userEvent.type(screen.getByLabelText("Email"), "wakil@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password1234");
    await userEvent.type(screen.getByLabelText("Confirm password"), "password1234");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(webMutate).toHaveBeenCalledWith({ first_name: "Wakil", last_name: "Azeez", business_name: "Wakil Stores", email: "wakil@example.com", password: "password1234" });
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
