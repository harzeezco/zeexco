import { Suspense } from "react";
import { WhatsAppRegistrationFlow } from "@/features/auth/components/whatsapp-registration-flow";

export default function WhatsAppRegisterPage() {
  return <Suspense fallback={<main className="min-h-svh bg-[#fffaf4]" aria-label="Loading registration" />}><WhatsAppRegistrationFlow /></Suspense>;
}
