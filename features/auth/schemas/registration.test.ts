import { describe, expect, it } from "vitest";
import {
  passwordSchema,
  webRegistrationSchema,
  whatsappRegistrationSchema,
} from "./registration";

describe("registration schemas", () => {
  it("requires a web password with at least eight characters", () => {
    const base = {
      first_name: "Wakil",
      last_name: "Azeez",
      business_name: "Stores",
      email: "wakil@example.com",
    };
    expect(
      webRegistrationSchema.safeParse({ ...base, password: "short" }).success,
    ).toBe(false);
    expect(
      webRegistrationSchema.safeParse({ ...base, password: "password1!" })
        .success,
    ).toBe(true);
  });

  it.each([
    ["", "Password is required"],
    ["Ab1!", "Password must be at least 8 characters"],
    ["1234567!", "Password must contain at least one letter"],
    ["password!", "Password must contain at least one number"],
    ["password1", "Password must contain at least one symbol"],
    ["password1 ", "Password must contain at least one symbol"],
  ])("explains the missing requirement for %s", (password, message) => {
    const result = passwordSchema.safeParse(password);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe(message);
  });

  it.each(["password1!", "PASSWORD1!", "Abcdef1!"])(
    "accepts either letter case: %s",
    (password) => {
      expect(passwordSchema.safeParse(password).success).toBe(true);
    },
  );

  it("requires email and password for WhatsApp browser registration", () => {
    const base = {
      first_name: "Wakil",
      last_name: "Azeez",
      business_name: "Stores",
      password: "Password1!",
    };
    expect(
      whatsappRegistrationSchema.safeParse({ ...base, email: "" }).success,
    ).toBe(false);
    expect(
      whatsappRegistrationSchema.safeParse({ ...base, email: "not-email" })
        .success,
    ).toBe(false);
    expect(
      whatsappRegistrationSchema.safeParse({
        ...base,
        email: "ada@example.com",
        password: "",
      }).success,
    ).toBe(false);
    expect(
      whatsappRegistrationSchema.safeParse({
        ...base,
        email: "ada@example.com",
      }).success,
    ).toBe(true);
  });

  it("counts Unicode characters and UTF-8 bytes and preserves the exact password", () => {
    expect(passwordSchema.parse("  élève١! ")).toBe("  élève١! ");
    expect(passwordSchema.safeParse("😀😀😀😀😀a1!").success).toBe(true);
    expect(passwordSchema.safeParse("😀😀a1!").success).toBe(false);
    expect(passwordSchema.safeParse("é".repeat(34) + "a1!x").success).toBe(
      true,
    );
    expect(passwordSchema.safeParse("é".repeat(35) + "a1!").success).toBe(
      false,
    );
    expect(passwordSchema.safeParse("letters١! ").success).toBe(true);
    expect(passwordSchema.safeParse("letters1\u0301").success).toBe(false);
  });
});
