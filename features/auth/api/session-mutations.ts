"use client";

import { useMutation } from "@tanstack/react-query";
import type { LoginValues } from "../schemas/login";
import { loadSession, login, logout, restoreSession } from "./session";

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: LoginValues) => login(email, password),
    gcTime: 0,
  });
}

export function useLogout() {
  return useMutation({ mutationFn: logout });
}

export function useReloadSession() {
  // Re-read current memberships; a refresh response contains no account details.
  return useMutation({ mutationFn: loadSession });
}

export function useRestoreSession() {
  return useMutation({ mutationFn: restoreSession });
}
