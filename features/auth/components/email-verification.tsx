"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  parseVerificationError,
  useVerifyEmail,
  type VerificationFailure,
} from "../api/email-verification";
import { VerificationLayout } from "./verification-layout";

type VerificationState = "loading" | "success" | VerificationFailure;

const content: Record<
  VerificationFailure,
  { eyebrow: string; title: string; description: string }
> = {
  invalid: {
    eyebrow: "Invalid link",
    title: "This verification link is invalid.",
    description:
      "Check that you opened the complete link from your verification email.",
  },
  consumed: {
    eyebrow: "Already verified",
    title: "This link has already been used.",
    description:
      "Your email may already be verified. Try logging in to continue.",
  },
  expired: {
    eyebrow: "Link expired",
    title: "This verification link has expired.",
    description:
      "Return to registration or login to continue. A new link cannot be requested from this page.",
  },
  server: {
    eyebrow: "Verification unavailable",
    title: "Verification could not be completed.",
    description:
      "Something went wrong while activating your account. Please try again.",
  },
  network: {
    eyebrow: "Connection problem",
    title: "We could not connect to Zico.",
    description: "Check your connection, then try again.",
  },
};

export function EmailVerification({ token }: { token?: string }) {
  const mutation = useVerifyEmail();
  const { mutate } = mutation;
  const state: VerificationState = !token
    ? "invalid"
    : mutation.isSuccess
      ? "success"
      : mutation.isError
        ? parseVerificationError(mutation.error)
        : "loading";
  const startedToken = useRef<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  function retry() {
    if (!token || mutation.isPending) return;
    mutate(token);
  }

  useEffect(() => {
    if (!token || startedToken.current === token) return;
    startedToken.current = token;
    mutate(token);
  }, [mutate, token]);

  useEffect(() => {
    if (!token) return;
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${window.location.hash}`,
    );
  }, [token]);

  useEffect(() => {
    if (state !== "loading") headingRef.current?.focus();
  }, [state]);

  if (state === "loading") {
    return (
      <VerificationLayout
        eyebrow="Email verification"
        title="Verifying your email"
        description="Please wait while we activate your account."
        titleRef={headingRef}
      >
        <div role="status" aria-live="polite" className="verification-notice">
          <span
            className="h-6 w-6 shrink-0 motion-safe:animate-spin rounded-full border-2 border-[#dbe6fc] border-t-[#1954d8]"
            aria-hidden="true"
          />
          <span>
            <strong>Your email is being verified</strong>This will only take a
            moment. Please keep this page open.
          </span>
        </div>
      </VerificationLayout>
    );
  }

  if (state === "success") {
    const continuation =
      mutation.data?.next_step === "CONTINUE_IN_WHATSAPP"
        ? mutation.data
        : null;
    return (
      <VerificationLayout
        eyebrow="Email verified"
        title="Your account is complete"
        description={
          continuation
            ? "Your email is verified. Continue onboarding in your original WhatsApp conversation."
            : "Your email has been verified and your account is ready. Log in to start managing your business."
        }
        titleRef={headingRef}
      >
        <div role="status" aria-live="polite" className="grid gap-5">
          <div className="verification-notice">
            <CheckCircle2
              className="size-6 shrink-0 text-[#1954d8]"
              aria-hidden="true"
            />
            <span>
              <strong>You are all set</strong>Your email is confirmed. Welcome
              to Zico.
            </span>
          </div>
          {continuation ? (
            <>
              {continuation.redirect_url ? (
                <a
                  href={continuation.redirect_url}
                  className="verification-action"
                  referrerPolicy="no-referrer"
                  rel="noreferrer"
                >
                  Continue in WhatsApp
                </a>
              ) : (
                <p className="m-0 rounded-md bg-[#f3f6fc] p-4 text-sm leading-6 text-[#61708a]">
                  A direct WhatsApp link is unavailable. Return to the WhatsApp
                  chat where you started registration, type Continue, then tap
                  Send to continue.
                </p>
              )}
              <p className="m-0 text-sm leading-6 text-[#64748b]">
                Open WhatsApp, then tap Send to continue.
              </p>
              <Link href="/login" className="auth-text-link">
                Log in
              </Link>
            </>
          ) : (
            <Link href="/login" className="verification-action">
              Log in
            </Link>
          )}
        </div>
      </VerificationLayout>
    );
  }

  const details = content[state];
  const retryable = state === "server" || state === "network";
  return (
    <VerificationLayout
      eyebrow={details.eyebrow}
      title={details.title}
      description={details.description}
      titleRef={headingRef}
    >
      <div role="alert" aria-live="assertive" className="grid gap-3">
        {retryable ? (
          <Button type="button" onClick={retry} className="verification-action">
            Try again
          </Button>
        ) : null}
        {state === "consumed" ? (
          <Link href="/login" className="verification-action">
            Log in
          </Link>
        ) : null}
        {state === "expired" ? (
          <>
            <Link href="/register" className="verification-action">
              Register again
            </Link>
            <Link href="/login" className="auth-text-link">
              Return to login
            </Link>
          </>
        ) : null}
        {state === "invalid" ? (
          <Link href="/register" className="verification-action">
            Return to registration
          </Link>
        ) : null}
      </div>
    </VerificationLayout>
  );
}
