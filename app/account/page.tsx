"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authenticationError, retryAfterSeconds, selectBusiness } from "@/features/auth/api/session";
import { loginDestination } from "@/features/auth/return-path";
import { useLogout, useReloadSession } from "@/features/auth/api/session-mutations";
import { useSession } from "@/features/auth/components/session-provider";
import { VerificationLayout } from "@/features/auth/components/verification-layout";

export default function AccountPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status, session, error, selectedBusinessId } = useSession();
  const logoutMutation = useLogout();
  const refreshMutation = useReloadSession();
  const busy = logoutMutation.isPending || refreshMutation.isPending;
  const failure = logoutMutation.error || refreshMutation.error;
  const message = failure ? authenticationError(failure) : "";
  const [retrySeconds, setRetrySeconds] = useState(0);
  useEffect(() => {
    if (status === "anonymous") router.replace(loginDestination(`${window.location.pathname}${window.location.search}${window.location.hash}`));
  }, [status, router]);
  useEffect(() => {
    if (retrySeconds <= 0) return;
    const timer = window.setTimeout(() => setRetrySeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [retrySeconds]);

  function run(action: "retry" | "logout") {
    if (busy || retrySeconds > 0) return;
    logoutMutation.reset();
    refreshMutation.reset();
    const onError = (failure: unknown) => {
      const text = authenticationError(failure);
      setRetrySeconds(retryAfterSeconds(failure) || 2);
      toast.error(text);
    };
    if (action === "retry") refreshMutation.mutate(undefined, { onError });
    else logoutMutation.mutate(undefined, {
      onSuccess: () => { queryClient.clear(); router.replace("/login"); },
      onError,
    });
  }

  if (status === "restoring" || status === "anonymous") return <main className="grid min-h-svh place-items-center" role="status">Checking your session...</main>;
  if (status === "error" || !session) return (
    <VerificationLayout variant="account" eyebrow="Connection problem" title="We could not restore your session" description={error || "Please try again."}>
      {message ? <p role="alert">{message}</p> : null}
      <button className="verification-action disabled:opacity-60" disabled={busy || retrySeconds > 0} onClick={() => void run("retry")}>{busy ? "Checking session..." : retrySeconds > 0 ? `Try again in ${retrySeconds}s` : "Try again"}</button>
    </VerificationLayout>
  );

  const businesses = session.businesses;
  const selected = businesses.find((business) => business.id === selectedBusinessId);
  return (
    <VerificationLayout variant="account" eyebrow="Your account" title={`Welcome, ${session.user.first_name}`} description="You are logged in to Zico.">
      <div className="grid gap-5">
        {businesses.length === 0 ? <p className="verification-notice">No businesses are linked to your account yet.</p> : null}
        {businesses.length > 1 || (businesses.length === 1 && !selected) ? <div className="grid gap-2"><label htmlFor="business" className="text-xs font-semibold">Choose a business</label><select id="business" value={selectedBusinessId || ""} onChange={(event) => selectBusiness(event.target.value)} className="rounded-md border border-[#9aabc3] bg-white p-3 text-sm"><option value="">Select a business</option>{businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}</select></div> : null}
        {selected ? <div className="verification-notice"><span><strong>{selected.name}</strong>{selected.status === "SUSPENDED" ? "This business is suspended." : `Your role: ${selected.membership_role.toLowerCase()}`}</span></div> : null}
        {message ? <p role="alert" className="text-sm text-[#b42318]">{message}</p> : null}
        <button type="button" onClick={() => void run("logout")} disabled={busy || retrySeconds > 0} className="verification-action disabled:opacity-60">{busy ? "Logging out..." : retrySeconds > 0 ? `Try again in ${retrySeconds}s` : "Log out"}</button>
      </div>
    </VerificationLayout>
  );
}
