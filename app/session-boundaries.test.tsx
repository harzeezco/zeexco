import { describe, expect, it } from "vitest";
import RootLayout from "./layout";
import AccountLayout from "./account/layout";
import LoginPage from "./login/page";
import { QueryProvider } from "@/lib/query-client";
import { SessionProvider } from "@/features/auth/components/session-provider";

describe("browser session boundaries", () => {
  it("keeps public registration and activation outside the session provider", () => {
    const children = <span>Public flow</span>;
    const root = RootLayout({ children });
    const body = root.props.children;
    const provider = body.props.children[0];
    expect(provider.type).toBe(QueryProvider);
    expect(provider.props.children).toBe(children);
  });

  it("restores browser sessions for protected account pages", () => {
    expect(AccountLayout({ children: <span>Account</span> }).type).toBe(
      SessionProvider,
    );
  });

  it("restores existing browser sessions on the login route", async () => {
    expect((await LoginPage({ searchParams: Promise.resolve({}) })).type).toBe(
      SessionProvider,
    );
  });
});
