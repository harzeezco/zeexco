import { act, cleanup, render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api-client";
import { authenticatedApiClient, clearSession, loadSession, logout, selectBusiness } from "../api/session";
import { SessionProvider } from "./session-provider";

const noop = vi.hoisted(() => vi.fn());
vi.mock("../api/session-mutations", () => ({ useRestoreSession: () => ({ mutate: noop }) }));
beforeEach(() => { vi.restoreAllMocks(); clearSession(); });
afterEach(cleanup);

it("removes cached data on business/account changes and logout", async () => {
  const client = new QueryClient();
  render(<QueryClientProvider client={client}><SessionProvider><span>App</span></SessionProvider></QueryClientProvider>);
  const data = {
    status_code: 200, message: "Session retrieved successfully.",
    user: { id: "user", first_name: "Ada", status: "ACTIVE" },
    businesses: [{ id: "one", name: "One", status: "ACTIVE", membership_role: "STAFF" }, { id: "two", name: "Two", status: "ACTIVE", membership_role: "ADMIN" }],
  };
  const get = vi.spyOn(authenticatedApiClient, "get").mockResolvedValue({ data });
  await act(async () => { await loadSession(); });
  act(() => selectBusiness("one"));
  client.setQueryData(["business", "user", "one", "orders"], ["private"]);
  act(() => selectBusiness("two"));
  expect(client.getQueryCache().getAll()).toHaveLength(0);

  client.setQueryData(["business", "user", "two", "orders"], ["private"]);
  get.mockResolvedValueOnce({ data: { ...data, user: { ...data.user, id: "other" } } });
  await act(async () => { await loadSession(); });
  expect(client.getQueryCache().getAll()).toHaveLength(0);

  client.setQueryData(["private"], ["private"]);
  vi.spyOn(apiClient, "post").mockResolvedValueOnce({ status: 204 });
  await act(async () => { await logout(); });
  expect(client.getQueryCache().getAll()).toHaveLength(0);
});
