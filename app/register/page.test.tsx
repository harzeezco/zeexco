import { describe, expect, it } from "vitest";
import RegisterPage from "./page";
import WhatsAppRegisterPage from "../whatsapp/register/page";
import { WebRegistrationForm } from "@/features/auth/components/web-registration-form";
import { WhatsAppRegistrationFlow } from "@/features/auth/components/whatsapp-registration-flow";

describe("registration entry", () => {
  it("retains ordinary registration when the parameter is absent", async () => {
    expect(
      (await RegisterPage({ searchParams: Promise.resolve({}) })).type,
    ).toBe(WebRegistrationForm);
  });
  it("keeps an opaque onboarding token unchanged", async () => {
    const page = await RegisterPage({
      searchParams: Promise.resolve({ token: "opaque/+?&=" }),
    });
    expect(page.type).toBe(WhatsAppRegistrationFlow);
    expect(page.props.token).toBe("opaque/+?&=");
  });
  it.each(["", "   ", ["one", "two"], ["one"]])(
    "rejects empty or repeated token input %s",
    async (token) => {
      const page = await RegisterPage({
        searchParams: Promise.resolve({ token }),
      });
      expect(page.type).toBe(WhatsAppRegistrationFlow);
      expect(page.props.token).toBeNull();
    },
  );
  it("rejects a missing token on the legacy WhatsApp entry", async () => {
    expect(
      (await WhatsAppRegisterPage({ searchParams: Promise.resolve({}) })).props
        .token,
    ).toBeNull();
  });
});
