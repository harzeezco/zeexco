import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AccountPage from "./page";

const mocks = vi.hoisted(() => ({ logout: vi.fn(), refresh: vi.fn(), replace: vi.fn(), status: "authenticated" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/features/auth/api/session", async (original) => ({
  ...await original<typeof import("@/features/auth/api/session")>(),
  logout: mocks.logout,
  loadSession: mocks.refresh,
}));
vi.mock("@/features/auth/components/session-provider", () => ({
  useSession: () => ({ status: mocks.status, session: { user: { first_name: "Ada" }, businesses: [] }, error: "Session unavailable" }),
}));

function renderAccount() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><AccountPage /></QueryClientProvider>);
  return client;
}

beforeEach(() => { vi.clearAllMocks(); mocks.status = "authenticated"; });
afterEach(cleanup);

describe("account mutations", () => {
  it("waits for logout before clearing cached account data and navigating", async () => {
    let finish!: () => void;
    mocks.logout.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    const client = renderAccount();
    client.setQueryData(["private-account"], { id: "account" });
    await userEvent.dblClick(screen.getByRole("button", { name: "Log out" }));
    expect(mocks.logout).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Logging out..." })).toBeDisabled();
    expect(client.getQueryData(["private-account"])).toBeDefined();
    expect(mocks.replace).not.toHaveBeenCalled();
    await act(async () => finish());
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/login"));
    expect(client.getQueryData(["private-account"])).toBeUndefined();
  });

  it("keeps account data and displays a cooldown when logout fails", async () => {
    mocks.logout.mockRejectedValueOnce(new Error("Unavailable"));
    const client = renderAccount();
    client.setQueryData(["private-account"], { id: "account" });
    await userEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Authentication could not be completed");
    expect(screen.getByRole("button", { name: "Try again in 2s" })).toBeDisabled();
    expect(client.getQueryData(["private-account"])).toBeDefined();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("uses the refresh mutation to retry session restoration", async () => {
    mocks.status = "error";
    let finish!: () => void;
    mocks.refresh.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    renderAccount();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Checking session..." })).toBeDisabled();
    await act(async () => finish());
    await waitFor(() => expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled());
  });
});
