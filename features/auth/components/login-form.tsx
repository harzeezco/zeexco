"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { RegistrationField } from "./registration-field";
import { VerificationLayout } from "./verification-layout";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Login is not available yet. Please try again later.");
  }

  return (
    <VerificationLayout variant="login" eyebrow="Welcome back" title="Log in to your account" description="Good to see you again. Enter your details to continue.">
      <form onSubmit={handleSubmit} className="grid gap-5">
        <RegistrationField id="login-email" name="email" label="Email address" type="email" autoComplete="username" placeholder="you@example.com" required />
        <RegistrationField id="login-password" name="password" label="Password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" required trailing={
          <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="grid size-9 place-items-center rounded text-[#61708a] hover:bg-[#f3f6fc]">
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        } />
        {message ? <p role="alert" className="m-0 text-sm text-[#b42318]">{message}</p> : null}
        <button type="submit" className="verification-action cursor-pointer border-0">Log in</button>
      </form>
    </VerificationLayout>
  );
}
