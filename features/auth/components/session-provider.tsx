"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sessionStore } from "../api/session";
import { useRestoreSession } from "../api/session-mutations";

export function useSession() {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot, sessionStore.getServerSnapshot);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { mutate } = useRestoreSession();
  useEffect(() => {
    let previous = sessionStore.getSnapshot();
    return sessionStore.subscribe(() => {
      const next = sessionStore.getSnapshot();
      if (previous.session?.user.id !== next.session?.user.id || previous.selectedBusinessId !== next.selectedBusinessId) {
        queryClient.removeQueries();
      }
      previous = next;
    });
  }, [queryClient]);
  useEffect(() => { mutate(); }, [mutate]);
  return children;
}
