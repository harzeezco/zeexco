import axios, { type InternalAxiosRequestConfig } from "axios";
import { apiClient, normalizeApiError } from "@/lib/api-client";
import type { UserSummary } from "../types";

export interface AuthBusiness {
  id: string;
  name: string;
  status: "ACTIVE" | "SUSPENDED";
  membership_role: "OWNER" | "ADMIN" | "STAFF";
}
export interface AuthMessageResponse { status_code: number; message: string }
export interface SessionResponse extends AuthMessageResponse {
  user: UserSummary;
  businesses: AuthBusiness[];
}
type SessionState = {
  status: "restoring" | "authenticated" | "anonymous" | "error";
  session: SessionResponse | null;
  selectedBusinessId: string | null;
  error: string | null;
};
const initialState: SessionState = { status: "restoring", session: null, selectedBusinessId: null, error: null };
let state = initialState;
const listeners = new Set<() => void>();
let generation = 0;
let cookieVersion = 0;
let loggingOut = false;
let refreshPromise: Promise<AuthMessageResponse> | null = null;
let sessionPromise: Promise<SessionResponse> | null = null;
let restorePromise: Promise<void> | null = null;
let retryAt = 0;

export const sessionStore = {
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  getSnapshot: () => state,
  getServerSnapshot: () => initialState,
};
function update(next: SessionState) { state = next; listeners.forEach((listener) => listener()); }
function current(operation: number) { return generation === operation && !loggingOut; }
function assertCurrent(operation: number) {
  if (!current(operation)) throw new axios.CanceledError("Authentication changed while the request was running.");
}
export function clearSession(error: string | null = null) {
  generation++;
  cookieVersion++;
  sessionPromise = null;
  update({ status: "anonymous", session: null, selectedBusinessId: null, error });
}
export function selectBusiness(id: string | null) {
  const selectedBusinessId = state.session?.businesses.some((business) => business.id === id) ? id : null;
  if (selectedBusinessId !== state.selectedBusinessId) update({ ...state, selectedBusinessId });
}
export function tenantQueryKey(...key: readonly unknown[]) {
  if (state.status !== "authenticated" || !state.session || !state.selectedBusinessId) throw new Error("Select a business before loading business data.");
  return ["business", state.session.user.id, state.selectedBusinessId, ...key] as const;
}

export function removeLegacyTokens() {
  for (const storageName of ["localStorage", "sessionStorage"] as const) {
    for (const key of ["access_token", "refresh_token", "accessToken", "refreshToken", "token"]) {
      try { window[storageName].removeItem(key); } catch { /* Storage may be disabled. Cookies still work. */ }
    }
  }
}

const recognizedCodes = new Set(["INVALID_JSON", "INVALID_CREDENTIALS", "EMAIL_VERIFICATION_REQUIRED", "RATE_LIMITED", "AUTHENTICATION_FAILED", "INVALID_REFRESH_SESSION", "CSRF_ORIGIN_REJECTED", "REFRESH_FAILED", "SESSION_LOOKUP_FAILED", "ACCOUNT_INACTIVE", "ACCOUNT_SUSPENDED"]);
export function authenticationError(error: unknown) {
  const details = normalizeApiError(error);
  if (details.code && recognizedCodes.has(details.code)) return details.message;
  if (axios.isAxiosError(error) && error.response?.status === 403) return details.message || "This request was blocked. Please contact support.";
  if (axios.isAxiosError(error) && !error.response) return "Could not connect to Zico. Check your connection and try again.";
  return "Authentication could not be completed. Please try again.";
}
export function retryAfterSeconds(error: unknown) {
  if (!axios.isAxiosError(error) || error.response?.status !== 429) return 0;
  const header = error.response.headers?.["retry-after"];
  const seconds = Number(header);
  if (header != null && Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds);
  const date = typeof header === "string" ? Date.parse(header) : NaN;
  return Number.isFinite(date) ? Math.max(1, Math.ceil((date - Date.now()) / 1000)) : 60;
}

export function refreshSession(): Promise<AuthMessageResponse> {
  if (loggingOut) return Promise.reject(new axios.CanceledError("Logout is in progress."));
  if (refreshPromise) return refreshPromise;
  if (Date.now() < retryAt) return Promise.reject(new Error("Please wait before retrying your session."));
  const operation = generation;
  const request = apiClient.post<AuthMessageResponse>("/api/v1/auth/refresh", undefined, { withCredentials: true })
    .then(({ data }) => {
      assertCurrent(operation);
      cookieVersion++;
      retryAt = 0;
      return data;
    })
    .catch((error: unknown) => {
      if (current(operation)) {
        retryAt = Date.now() + Math.max(1, retryAfterSeconds(error)) * 1000;
        if (axios.isAxiosError(error) && error.response?.status === 401) clearSession();
        else update({ ...state, status: "error", error: authenticationError(error) });
      }
      throw error;
    })
    .finally(() => { if (refreshPromise === request) refreshPromise = null; });
  refreshPromise = request;
  return request;
}

type ProtectedConfig = InternalAxiosRequestConfig & { sessionRetried?: boolean; authGeneration?: number; cookieVersion?: number };
// Public auth endpoints use apiClient so they can never intercept themselves.
export const authenticatedApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || undefined,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});
authenticatedApiClient.interceptors.request.use((config: ProtectedConfig) => {
  if (loggingOut) throw new axios.CanceledError("Logout is in progress.");
  config.authGeneration ??= generation;
  assertCurrent(config.authGeneration);
  config.cookieVersion = cookieVersion;
  return config;
});
authenticatedApiClient.interceptors.response.use((response) => {
  assertCurrent((response.config as ProtectedConfig).authGeneration ?? generation);
  return response;
}, async (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) throw error;
  const config = error.config as ProtectedConfig;
  assertCurrent(config.authGeneration ?? generation);
  if (config.sessionRetried) { clearSession(); throw error; }
  config.sessionRetried = true;
  // A late 401 for an older cookie uses the refresh already completed by a peer.
  if (config.cookieVersion === cookieVersion) await refreshSession();
  assertCurrent(config.authGeneration ?? generation);
  return authenticatedApiClient.request(config);
});

export function loadSession(): Promise<SessionResponse> {
  if (loggingOut) return Promise.reject(new axios.CanceledError("Logout is in progress."));
  if (sessionPromise) return sessionPromise;
  const operation = generation;
  const request = authenticatedApiClient.get<SessionResponse>("/api/v1/auth/session")
    .then(({ data }) => {
      assertCurrent(operation);
      if (!data.user || !Array.isArray(data.businesses)) throw new Error("Invalid session response.");
      if (data.user.status !== "ACTIVE") {
        clearSession("Your account is no longer active. Please contact support.");
        throw new Error("Your account is no longer active.");
      }
      const sameUser = state.session?.user.id === data.user.id;
      const selectedBusinessId = sameUser && data.businesses.some((business) => business.id === state.selectedBusinessId)
        ? state.selectedBusinessId
        : sameUser && state.selectedBusinessId ? null : data.businesses.length === 1 ? data.businesses[0].id : null;
      update({ status: "authenticated", session: data, selectedBusinessId, error: null });
      return data;
    })
    .catch((error: unknown) => {
      if (current(operation)) {
        if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) clearSession(error.response?.status === 403 ? authenticationError(error) : null);
        else update({ ...state, status: "error", error: authenticationError(error) });
      }
      throw error;
    })
    .finally(() => { if (sessionPromise === request) sessionPromise = null; });
  sessionPromise = request;
  return request;
}

export function restoreSession() {
  if (!restorePromise) {
    removeLegacyTokens();
    restorePromise = loadSession().then(() => {}, () => {});
  }
  return restorePromise;
}

export async function login(email: string, password: string) {
  await restoreSession();
  const operation = ++generation;
  sessionPromise = null;
  const { data } = await apiClient.post<AuthMessageResponse>("/api/v1/auth/login", { email: email.trim().toLowerCase(), password }, { withCredentials: true });
  assertCurrent(operation);
  cookieVersion++;
  retryAt = 0;
  await loadSession();
  assertCurrent(operation);
  return data;
}

export async function logout() {
  // Invalidate in-flight reads immediately. Wait for cookie writes before revocation.
  generation++;
  loggingOut = true;
  sessionPromise = null;
  const refresh = refreshPromise;
  if (refresh) await refresh.then(() => {}, () => {});
  return apiClient.post("/api/v1/auth/logout", undefined, { withCredentials: true })
    .then(() => { clearSession(); retryAt = 0; })
    .finally(() => { loggingOut = false; });
}
