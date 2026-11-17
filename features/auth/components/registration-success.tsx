"use client";

import Link from "next/link";
import { MailCheck } from "lucide-react";
import { useSyncExternalStore } from "react";
import { WebRegistrationLayout } from "./web-registration-layout";

const storageKey = "zico-registration-confirmation";
type Confirmation = { email: string; message: string; whatsapp?: boolean };

export function saveRegistrationConfirmation({
  email,
  message,
  whatsapp,
}: Confirmation) {
  try {
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        email,
        message,
        ...(whatsapp ? { whatsapp: true } : {}),
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function RegistrationConfirmation({
  email,
  message,
  whatsapp,
}: Confirmation) {
  return (
    <WebRegistrationLayout>
      <div className="grid gap-5">
        <span className="grid size-14 place-items-center rounded-full bg-[#eef4ff] text-[#1f5bd8]">
          <MailCheck size={28} aria-hidden="true" />
        </span>
        <p className="m-0 text-xs font-bold tracking-[0.14em] text-[#1f5bd8] uppercase">
          Registration successful
        </p>
        <h1 className="m-0 text-3xl font-bold tracking-tight text-[#14233d]">
          Check your email
        </h1>
        <p className="m-0 text-sm leading-6 text-[#64748b]">
          {message || "Your registration was successful."}
        </p>
        {email ? (
          <p className="m-0 text-sm leading-6 text-[#475569]">
            We sent a verification link to{" "}
            <strong className="break-all text-[#14233d]">{email}</strong>.
          </p>
        ) : null}
        <p className="m-0 text-sm leading-6 text-[#64748b]">
          Open the link in your email to activate your account. Check your spam
          or junk folder if you cannot find it.
        </p>
        {whatsapp ? (
          <p className="m-0 text-sm leading-6 text-[#64748b]">
            After activation, return to the WhatsApp conversation where you
            started to continue onboarding.
          </p>
        ) : null}
        {!whatsapp ? (
          <Link href="/login" className="verification-action">
            Return to login
          </Link>
        ) : null}
      </div>
    </WebRegistrationLayout>
  );
}

const subscribe = () => () => {};
function getSnapshot() {
  try {
    return sessionStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

export function RegistrationSuccess() {
  const saved = useSyncExternalStore(subscribe, getSnapshot, () => null);
  let confirmation: Confirmation | undefined;
  try {
    const value: unknown = saved ? JSON.parse(saved) : null;
    if (
      value &&
      typeof value === "object" &&
      "email" in value &&
      typeof value.email === "string" &&
      "message" in value &&
      typeof value.message === "string"
    ) {
      confirmation = {
        email: value.email,
        message: value.message,
        whatsapp: "whatsapp" in value && value.whatsapp === true,
      };
    }
  } catch {
    /* A missing confirmation must not imply successful registration. */
  }

  if (confirmation) return <RegistrationConfirmation {...confirmation} />;
  return (
    <WebRegistrationLayout>
      <h1 className="text-3xl font-bold">Create your Zico account</h1>
      <p className="my-5 text-sm leading-6 text-[#64748b]">
        Complete registration to receive an email verification link.
      </p>
      <Link href="/register" className="verification-action">
        Go to registration
      </Link>
    </WebRegistrationLayout>
  );
}
