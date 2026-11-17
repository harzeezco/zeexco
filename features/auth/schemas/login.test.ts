import { describe, expect, it } from "vitest";
import { loginSchema } from "./login";

describe("login validation", () => {
  it("normalizes only email and preserves the password exactly", () => {
    expect(loginSchema.parse({ email: "  Merchant@Example.com ", password: "  Ab  " })).toEqual({ email: "merchant@example.com", password: "  Ab  " });
  });
  it.each([
    [{ email: "", password: "a" }, "Email is required"],
    [{ email: "invalid", password: "a" }, "Enter a valid email address"],
    [{ email: "a@b.com", password: "" }, "Password is required"],
  ])("validates required login fields", (values, message) => {
    const result = loginSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe(message);
  });
});
