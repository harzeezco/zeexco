"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { retryAfterSeconds } from "@/lib/retry-after";
import {
  requestWhatsAppOTP,
  verifyWhatsAppOTP,
  type WhatsAppChallenge,
} from "../api/registration";
import { parseRegistrationError } from "../api/registration-errors";
import { WebRegistrationLayout } from "./web-registration-layout";
import { RegistrationField } from "./registration-field";
import { FormFeedback } from "./form-feedback";
import { AccountSwitch } from "./account-switch";
import { MerchantProfileForm } from "./merchant-profile-form";

export function WebRegistrationForm() {
  const [number, setNumber] = useState("");
  const [challenge, setChallenge] = useState<WhatsAppChallenge | null>(null);
  const [otp, setOTP] = useState("");
  const [proof, setProof] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(Date.now);
  const locked = useRef(false);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);
  const retrySeconds = Math.max(0, Math.ceil((retryAt - now) / 1000));
  const resendSeconds = Math.max(
    0,
    Math.ceil((Math.max(resendAt, retryAt) - now) / 1000),
  );
  const expired = Boolean(challenge && Date.parse(challenge.expires_at) <= now);
  function restart() {
    setChallenge(null);
    setOTP("");
    setProof(null);
    setError("");
  }
  async function request(resend = false) {
    if (
      locked.current ||
      Date.now() < retryAt ||
      (resend && Date.now() < resendAt)
    )
      return;
    if (!/^\+[1-9]\d{7,14}$/.test(number.trim())) {
      setError(
        "Enter an international WhatsApp number with country code, for example +2348012345678.",
      );
      return;
    }
    locked.current = true;
    setPending(true);
    setError("");
    setOTP("");
    setProof(null);
    // A resend starts a new challenge; never verify against the old one.
    if (resend) setChallenge(null);
    try {
      const next = await requestWhatsAppOTP(number.trim());
      setChallenge(next);
      setResendAt(Date.now() + 60000);
      setNow(Date.now());
    } catch (failure) {
      setError(parseRegistrationError(failure));
      const until = Date.now() + retryAfterSeconds(failure) * 1000;
      setRetryAt(until);
      setNow(Date.now());
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  async function verify() {
    if (locked.current || !challenge || expired || Date.now() < retryAt) return;
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the six-digit code.");
      return;
    }
    locked.current = true;
    setPending(true);
    setError("");
    try {
      const result = await verifyWhatsAppOTP(challenge.challenge_id, otp);
      setProof(result.registration_challenge_token);
      setOTP("");
      setChallenge(null);
    } catch (failure) {
      setError(parseRegistrationError(failure));
      setRetryAt(Date.now() + retryAfterSeconds(failure) * 1000);
      setNow(Date.now());
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  return (
    <WebRegistrationLayout>
      <AccountSwitch page="register" />
      {proof ? (
        <MerchantProfileForm
          proof={{ registration_challenge_token: proof }}
          restart={restart}
        />
      ) : (
        <>
          <h1 className="m-0 text-[28px] font-bold text-[#14233d]">
            {challenge
              ? "Verify your WhatsApp number"
              : "Create your Zico account"}
          </h1>
          <p className="mt-2 mb-6 text-sm leading-6 text-[#68778f]">
            {challenge
              ? "If this number can receive WhatsApp verification, a code has been requested."
              : "Start with your international WhatsApp number."}
          </p>
          <form
            className="grid gap-4"
            noValidate
            aria-busy={pending}
            onSubmit={(event) => {
              event.preventDefault();
              void (challenge ? verify() : request());
            }}
          >
            {challenge ? (
              <>
                <p className="text-sm">{number}</p>
                <RegistrationField
                  id="whatsapp-otp"
                  label="Verification code"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(event) =>
                    setOTP(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  disabled={pending}
                  helperText="Enter all six digits, including any leading zeros."
                />
                {expired ? (
                  <p role="status">
                    This code has expired. Request a new code.
                  </p>
                ) : null}
                <Button
                  type="submit"
                  disabled={pending || expired || retrySeconds > 0}
                >
                  {pending ? "Verifying..." : "Verify code"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending || resendSeconds > 0}
                  onClick={() => void request(true)}
                >
                  {resendSeconds > 0
                    ? "Resend code in " + resendSeconds + "s"
                    : "Resend code"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={pending}
                  onClick={restart}
                >
                  Change number
                </Button>
              </>
            ) : (
              <>
                <RegistrationField
                  id="whatsapp-number"
                  label="WhatsApp number"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+2348012345678"
                  value={number}
                  onChange={(event) => {
                    setNumber(event.target.value);
                    setOTP("");
                    setProof(null);
                    setError("");
                  }}
                  disabled={pending}
                />
                <Button
                  type="submit"
                  disabled={pending || retrySeconds > 0 || resendSeconds > 0}
                >
                  {pending ? "Requesting code..." : "Request code"}
                </Button>
                {resendSeconds > 0 && retrySeconds === 0 ? (
                  <p role="status">
                    Request another code in {resendSeconds} seconds.
                  </p>
                ) : null}
              </>
            )}
            {error ? <FormFeedback message={error} /> : null}
            {retrySeconds > 0 ? (
              <p role="status">Try again in {retrySeconds} seconds.</p>
            ) : null}
          </form>
        </>
      )}
    </WebRegistrationLayout>
  );
}
