import { describe, expect, it } from "vitest";
import { webRegistrationSchema as schema } from "./registration";
const base = {
  first_name: "Ada",
  last_name: "Obi",
  business_name: "Stores",
  email: "",
};
describe("merchant profile validation", () => {
  it("allows blank email and normalizes names and email", () => {
    expect(
      schema.parse({
        ...base,
        first_name: "  Ada   Maria  ",
        email: " ADA@EXAMPLE.COM ",
      }),
    ).toEqual({ ...base, first_name: "Ada Maria", email: "ada@example.com" });
    expect(schema.safeParse(base).success).toBe(true);
  });
  it.each(["first_name", "last_name", "business_name"])(
    "requires %s",
    (field) => {
      expect(schema.safeParse({ ...base, [field]: "  " }).success).toBe(false);
    },
  );
  it("counts Unicode code points and enforces name limits", () => {
    expect(
      schema.safeParse({
        ...base,
        first_name: "😀".repeat(100),
        business_name: "a".repeat(200),
      }).success,
    ).toBe(true);
    expect(
      schema.safeParse({ ...base, first_name: "a".repeat(101) }).success,
    ).toBe(false);
    expect(
      schema.safeParse({ ...base, last_name: "a".repeat(101) }).success,
    ).toBe(false);
    expect(
      schema.safeParse({ ...base, business_name: "a".repeat(201) }).success,
    ).toBe(false);
  });
  it("rejects invalid emails and emails over 255 UTF-8 bytes", () => {
    expect(schema.safeParse({ ...base, email: "invalid" }).success).toBe(false);
    expect(
      schema.safeParse({ ...base, email: "é".repeat(123) + "@example.com" })
        .success,
    ).toBe(false);
  });
});
