import { describe, expect, it } from "vitest";
import { webRegistrationSchema, whatsappRegistrationSchema } from "./registration";

describe("registration schemas", () => {
  it("rejects mismatched web passwords", () => {
    const result = webRegistrationSchema.safeParse({ first_name: "Wakil", last_name: "Azeez", business_name: "Stores", email: "wakil@example.com", password: "password1234", confirm_password: "different1234" });
    expect(result.success).toBe(false);
  });

  it("allows an omitted WhatsApp email value but rejects malformed email", () => {
    const base = { first_name: "Wakil", last_name: "Azeez", business_name: "Stores" };
    expect(whatsappRegistrationSchema.safeParse({ ...base, email: "" }).success).toBe(true);
    expect(whatsappRegistrationSchema.safeParse({ ...base, email: "not-email" }).success).toBe(false);
  });
});
