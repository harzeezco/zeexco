"use client";

import { useEffect, useState } from "react";
import { retryAfterSeconds } from "@/lib/retry-after";

export function useRetryAfter(error: unknown, failedAt: number) {
  const delay = retryAfterSeconds(error);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!delay || !failedAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [delay, failedAt]);
  if (!delay || !failedAt) return 0;
  return Math.max(
    0,
    Math.min(delay, Math.ceil((failedAt + delay * 1000 - now) / 1000)),
  );
}
