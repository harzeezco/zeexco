import { RegistrationSuccess } from "@/features/auth/components/registration-success";
import type { Metadata } from "next";

export const metadata: Metadata = {
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function RegistrationSuccessPage() {
  return <RegistrationSuccess />;
}
