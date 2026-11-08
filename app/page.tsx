"use client";

import { FormEvent, useState } from "react";

export default function Home() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function joinWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), phone: form.get("phone") }),
    });
    setState(response.ok ? "success" : "error");
  }

  return (
    <main className="hero">
      <div className="hero-image" aria-hidden="true" />
      <div className="hero-wash" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Zeexco home">ZEEXCO<span aria-hidden="true">.</span></a>
        <span className="coming-soon">Coming soon</span>
      </header>

      <section className="hero-content" id="top" aria-labelledby="hero-title">
        <div className="copy">
          <p className="eyebrow"><span aria-hidden="true" />Built around how you already sell</p>
          <h1 id="hero-title">Your customers are talking. Zeexco helps you keep up.</h1>
          <p className="lede">Keep your products, customer conversations, follow-ups and orders organized — starting with the way you already sell on WhatsApp.</p>
        </div>

        <div className="waitlist-panel">
          {state === "success" ? (
            <div className="success" role="status">
              <span className="success-mark" aria-hidden="true">✓</span>
              <div><strong>You&apos;re on the list.</strong><p>We&apos;ll let you know when Zeexco is ready for early access.</p></div>
            </div>
          ) : (
            <form onSubmit={joinWaitlist}>
              <label><span>Your name</span><input name="name" type="text" autoComplete="name" placeholder="Ada Okafor" required /></label>
              <label><span>Phone / WhatsApp number</span><input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="0801 234 5678" required /></label>
              <button type="submit" disabled={state === "loading"}>{state === "loading" ? "Joining…" : "Join the waitlist"}<span aria-hidden="true">↗</span></button>
              {state === "error" && <p className="form-error" role="alert">Something went wrong. Please try again.</p>}
            </form>
          )}
          <p className="fine-print">Join us as we build Zeexco with real businesses.</p>
        </div>
      </section>

      <div className="context-note" aria-hidden="true">
        <span>For shops, sellers &amp; growing businesses</span><span className="line" /><span>Lagos, Nigeria</span>
      </div>
    </main>
  );
}
