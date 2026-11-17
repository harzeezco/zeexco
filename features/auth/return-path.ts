export function safeReturnTo(value?: string | null) {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return "/account";
  try {
    const url = new URL(value, "https://app.internal");
    const path = decodeURIComponent(url.pathname);
    if (url.origin !== "https://app.internal" || path.startsWith("//") || /[\\\u0000-\u0020]/.test(path) || /^\/(?:login|register|verify-email|api)(?:\/|$)/.test(path)) return "/account";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return "/account"; }
}

export function loginDestination(returnTo: string) {
  return `/login?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`;
}
