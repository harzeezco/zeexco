import axios from "axios";

export function retryAfterSeconds(error: unknown) {
  if (!axios.isAxiosError(error) || error.response?.status !== 429) return 0;
  const header = error.response.headers?.["retry-after"];
  const seconds = Number(header);
  if (header != null && Number.isFinite(seconds) && seconds > 0)
    return Math.ceil(seconds);
  const date = typeof header === "string" ? Date.parse(header) : NaN;
  return Number.isFinite(date)
    ? Math.max(1, Math.ceil((date - Date.now()) / 1000))
    : 60;
}
