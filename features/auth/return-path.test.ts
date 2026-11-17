import { describe, expect, it } from "vitest";
import { loginDestination, safeReturnTo } from "./return-path";

describe("internal return destinations", () => {
  it.each(["https://evil.test", "//evil.test", "/\\evil.test", "/%2f%2fevil.test", "/account\n", "/login?returnTo=/login", "/api/v1/auth/logout", "/%ZZ", "/../login"])("rejects %s", (path) => {
    expect(safeReturnTo(path)).toBe("/account");
  });
  it("preserves an internal path, query and fragment", () => {
    expect(safeReturnTo("/account?tab=businesses#settings")).toBe("/account?tab=businesses#settings");
    expect(loginDestination("/account?tab=businesses")).toBe("/login?returnTo=%2Faccount%3Ftab%3Dbusinesses");
  });
});
