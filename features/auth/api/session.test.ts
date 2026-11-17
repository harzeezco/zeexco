import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

const account = {
  status_code: 200, message: "Session retrieved successfully.",
  user: { id: "user", first_name: "Ada", last_name: "Okafor", email: "ada@example.com", status: "ACTIVE" }, businesses: [],
};
const refreshed = { status_code: 200, message: "Session refreshed successfully." };
const business = { id: "shop", name: "Shop", status: "ACTIVE", membership_role: "STAFF" };
function failure(status: number, code: string, config?: InternalAxiosRequestConfig, headers = {}) {
  return new AxiosError("Request failed", undefined, config, undefined, { status, data: { error: { code, message: "Backend message" } }, headers, config } as AxiosResponse);
}
function response(config: InternalAxiosRequestConfig, data: unknown = account): AxiosResponse {
  return { status: 200, data, statusText: "OK", config, headers: new AxiosHeaders() };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
async function setup() {
  const session = await import("./session");
  const { apiClient } = await import("@/lib/api-client");
  const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => response(config));
  session.authenticatedApiClient.defaults.adapter = adapter;
  return { ...session, apiClient, adapter, post: vi.spyOn(apiClient, "post") };
}
beforeEach(() => { vi.resetModules(); vi.restoreAllMocks(); localStorage.clear(); sessionStorage.clear(); });

describe("cookie-backed authentication", () => {
  it("logs in then loads session details before exposing authentication", async () => {
    const api = await setup();
    await api.restoreSession();
    api.clearSession();
    api.post.mockResolvedValueOnce({ data: { status_code: 200, message: "Welcome" } });
    const pending = deferred<AxiosResponse>();
    api.adapter.mockImplementationOnce(() => pending.promise);
    const request = api.login(" ADA@EXAMPLE.COM ", " Pass ");
    await vi.waitFor(() => expect(api.adapter).toHaveBeenCalledTimes(2));
    expect(api.sessionStore.getSnapshot().status).toBe("anonymous");
    expect(api.post).toHaveBeenCalledExactlyOnceWith("/api/v1/auth/login", { email: "ada@example.com", password: " Pass " }, { withCredentials: true });
    expect(api.adapter.mock.calls[1][0].url).toBe("/api/v1/auth/session");
    pending.resolve(response(api.adapter.mock.calls[1][0]));
    await expect(request).resolves.toEqual({ status_code: 200, message: "Welcome" });
    expect(api.sessionStore.getSnapshot().status).toBe("authenticated");
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it("keeps pending-verification login unauthenticated without fetching a session", async () => {
    const api = await setup();
    await api.restoreSession();
    api.clearSession();
    api.adapter.mockClear();
    api.post.mockRejectedValueOnce(failure(403, "EMAIL_VERIFICATION_REQUIRED"));
    await expect(api.login("ada@example.com", "password")).rejects.toBeDefined();
    expect(api.sessionStore.getSnapshot().status).toBe("anonymous");
    expect(api.adapter).not.toHaveBeenCalled();
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it("restores once on reload using GET session without renewing valid cookies", async () => {
    const api = await setup();
    await Promise.all([api.restoreSession(), api.restoreSession(), api.loadSession()]);
    expect(api.adapter).toHaveBeenCalledTimes(1);
    expect(api.adapter.mock.calls[0][0]).toMatchObject({ method: "get", url: "/api/v1/auth/session", withCredentials: true });
    expect(api.adapter.mock.calls[0][0].headers.has("Authorization")).toBe(false);
    expect(api.apiClient.defaults.withCredentials).toBe(true);
    expect(api.post).not.toHaveBeenCalled();
    expect(api.sessionStore.getSnapshot().session).toEqual(account);
  });

  it("refreshes once during startup after a session 401", async () => {
    const api = await setup();
    api.adapter.mockImplementationOnce(async (config) => { throw failure(401, "EXPIRED", config); });
    api.post.mockResolvedValueOnce({ data: refreshed });
    await api.restoreSession();
    expect(api.adapter).toHaveBeenCalledTimes(2);
    expect(api.post).toHaveBeenCalledExactlyOnceWith("/api/v1/auth/refresh", undefined, { withCredentials: true });
    expect(api.sessionStore.getSnapshot().status).toBe("authenticated");
  });

  it("shares one refresh for concurrent protected 401s and retries each once", async () => {
    const api = await setup();
    const pending = deferred<{ data: typeof refreshed }>();
    api.post.mockImplementationOnce(() => pending.promise);
    api.adapter.mockImplementation(async (config) => {
      if (!(config as InternalAxiosRequestConfig & { sessionRetried?: boolean }).sessionRetried) throw failure(401, "EXPIRED", config);
      return response(config, "ok");
    });
    const requests = Promise.all([api.authenticatedApiClient.get("/one"), api.authenticatedApiClient.get("/two")]);
    await vi.waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    pending.resolve({ data: refreshed });
    await requests;
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.adapter).toHaveBeenCalledTimes(4);
  });

  it("reuses a completed refresh for a late 401 using the older cookie", async () => {
    const api = await setup();
    const slow = deferred<void>();
    api.post.mockResolvedValue({ data: refreshed });
    api.adapter.mockImplementation(async (config) => {
      if (!(config as InternalAxiosRequestConfig & { sessionRetried?: boolean }).sessionRetried) {
        if (config.url === "/slow") await slow.promise;
        throw failure(401, "EXPIRED", config);
      }
      return response(config, "ok");
    });
    const slowRequest = api.authenticatedApiClient.get("/slow");
    await api.authenticatedApiClient.get("/fast");
    slow.resolve();
    await slowRequest;
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it("does not loop when the retried session request still returns 401", async () => {
    const api = await setup();
    api.post.mockResolvedValue({ data: refreshed });
    api.adapter.mockImplementation(async (config) => { throw failure(401, "EXPIRED", config); });
    await api.restoreSession();
    expect(api.adapter).toHaveBeenCalledTimes(2);
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.sessionStore.getSnapshot().status).toBe("anonymous");
  });

  it("clears an invalid refresh session without retrying protected requests", async () => {
    const api = await setup();
    api.adapter.mockImplementation(async (config) => { throw failure(401, "EXPIRED", config); });
    api.post.mockRejectedValue(failure(401, "INVALID_REFRESH_SESSION"));
    await api.restoreSession();
    expect(api.sessionStore.getSnapshot().status).toBe("anonymous");
    expect(api.adapter).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it.each([500, 429, undefined])("keeps session failure %s recoverable without refreshing", async (status) => {
    const api = await setup();
    api.adapter.mockImplementation(async (config) => { throw status ? failure(status, "SESSION_LOOKUP_FAILED", config) : new AxiosError("Network Error"); });
    await api.restoreSession();
    expect(api.sessionStore.getSnapshot().status).toBe("error");
    expect(api.post).not.toHaveBeenCalled();
    api.adapter.mockImplementation(async (config) => response(config));
    await api.loadSession();
    expect(api.sessionStore.getSnapshot().status).toBe("authenticated");
  });

  it.each([500, undefined])("keeps refresh failure %s recoverable without loops", async (status) => {
    const api = await setup();
    api.adapter.mockImplementation(async (config) => { throw failure(401, "EXPIRED", config); });
    api.post.mockRejectedValue(status ? failure(status, "REFRESH_FAILED") : new AxiosError("Network Error"));
    await api.restoreSession();
    expect(api.sessionStore.getSnapshot().status).toBe("error");
    expect(api.adapter).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it("rejects inactive accounts and preserves the backend 403 message", async () => {
    const api = await setup();
    api.adapter.mockImplementationOnce(async (config) => { throw failure(403, "ACCOUNT_INACTIVE", config); });
    await api.restoreSession();
    expect(api.sessionStore.getSnapshot()).toMatchObject({ status: "anonymous", session: null, error: "Backend message" });
    expect(api.post).not.toHaveBeenCalled();
    api.adapter.mockImplementationOnce(async (config) => response(config, { ...account, user: { ...account.user, status: "SUSPENDED" } }));
    await expect(api.loadSession()).rejects.toThrow("no longer active");
    expect(api.sessionStore.getSnapshot().status).toBe("anonymous");
  });

  it("handles empty memberships, current roles, suspended businesses, and removed selections", async () => {
    const api = await setup();
    await api.restoreSession();
    expect(api.sessionStore.getSnapshot().selectedBusinessId).toBeNull();
    api.adapter.mockImplementation(async (config) => response(config, { ...account, businesses: [business, { ...business, id: "suspended", status: "SUSPENDED", membership_role: "ADMIN" }] }));
    await api.loadSession();
    api.selectBusiness("suspended");
    expect(api.sessionStore.getSnapshot().selectedBusinessId).toBe("suspended");
    expect(api.tenantQueryKey("orders")).toEqual(["business", "user", "suspended", "orders"]);
    api.adapter.mockImplementation(async (config) => response(config, { ...account, businesses: [business] }));
    await api.loadSession();
    expect(api.sessionStore.getSnapshot().selectedBusinessId).toBeNull();
    api.selectBusiness("missing");
    expect(() => api.tenantQueryKey("orders")).toThrow("Select a business");
    api.selectBusiness("shop");
    expect(api.sessionStore.getSnapshot().session?.businesses[0].membership_role).toBe("STAFF");
  });

  it("clears selection when changing accounts", async () => {
    const api = await setup();
    api.adapter.mockImplementation(async (config) => response(config, { ...account, businesses: [business] }));
    await api.restoreSession();
    expect(api.sessionStore.getSnapshot().selectedBusinessId).toBe("shop");
    api.adapter.mockImplementation(async (config) => response(config, { ...account, user: { ...account.user, id: "other" }, businesses: [] }));
    await api.loadSession();
    expect(api.sessionStore.getSnapshot().selectedBusinessId).toBeNull();
  });

  it("clears state only after successful empty logout, and retains state on failure", async () => {
    const api = await setup();
    await api.restoreSession();
    api.post.mockRejectedValueOnce(failure(500, "REFRESH_FAILED"));
    await expect(api.logout()).rejects.toBeDefined();
    expect(api.sessionStore.getSnapshot().status).toBe("authenticated");
    api.post.mockResolvedValueOnce({ status: 204 });
    await api.logout();
    expect(api.post).toHaveBeenLastCalledWith("/api/v1/auth/logout", undefined, { withCredentials: true });
    expect(api.sessionStore.getSnapshot()).toMatchObject({ status: "anonymous", session: null, selectedBusinessId: null });
  });

  it("prevents an in-flight session response from restoring state after logout", async () => {
    const api = await setup();
    const pending = deferred<AxiosResponse>();
    api.adapter.mockImplementationOnce(() => pending.promise);
    const load = api.loadSession().then(() => "success", () => "cancelled");
    await vi.waitFor(() => expect(api.adapter).toHaveBeenCalledTimes(1));
    api.post.mockResolvedValueOnce({ status: 204 });
    await api.logout();
    pending.resolve(response(api.adapter.mock.calls[0][0]));
    expect(await load).toBe("cancelled");
    expect(api.sessionStore.getSnapshot().status).toBe("anonymous");
  });

  it("waits for an in-flight refresh to finish before revoking cookies", async () => {
    const api = await setup();
    await api.restoreSession();
    const pending = deferred<{ data: typeof refreshed }>();
    api.post.mockImplementationOnce(() => pending.promise).mockResolvedValueOnce({ status: 204 });
    const refresh = api.refreshSession().then(() => "success", () => "cancelled");
    const logout = api.logout();
    expect(api.post).toHaveBeenCalledTimes(1);
    pending.resolve({ data: refreshed });
    await logout;
    expect(await refresh).toBe("cancelled");
    expect(api.post.mock.calls.map(([url]) => url)).toEqual(["/api/v1/auth/refresh", "/api/v1/auth/logout"]);
    expect(api.sessionStore.getSnapshot().status).toBe("anonymous");
  });

  it("removes legacy tokens while preserving unrelated browser data", async () => {
    const api = await setup();
    localStorage.setItem("access_token", "old");
    sessionStorage.setItem("refreshToken", "old");
    localStorage.setItem("theme", "dark");
    sessionStorage.setItem("zico-registration-confirmation", "keep");
    await api.restoreSession();
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(sessionStorage.getItem("refreshToken")).toBeNull();
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(sessionStorage.getItem("zico-registration-confirmation")).toBe("keep");
  });

  it("reads Retry-After seconds and dates with a rate-limit fallback", async () => {
    const api = await setup();
    expect(api.retryAfterSeconds(failure(429, "RATE_LIMITED", undefined, { "retry-after": "12" }))).toBe(12);
    expect(api.retryAfterSeconds(failure(429, "RATE_LIMITED"))).toBe(60);
    expect(api.retryAfterSeconds(failure(429, "RATE_LIMITED", undefined, { "retry-after": new Date(Date.now() + 30_000).toUTCString() }))).toBeGreaterThan(28);
  });
});
