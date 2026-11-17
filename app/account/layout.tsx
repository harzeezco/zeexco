import type { ReactNode } from "react";
import { SessionProvider } from "@/features/auth/components/session-provider";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
