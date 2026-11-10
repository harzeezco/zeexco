import Link from "next/link";
import type { ReactNode } from "react";

export function AuthLayout({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-container">
        <Link href="/" className="auth-brand">zeex<span>co</span></Link>
        <section className="auth-card">
          <p className="auth-eyebrow">{eyebrow}</p>
          <h1 className="auth-title">{title}</h1>
          <p className="auth-description">{description}</p>
          {children}
        </section>
      </div>
    </main>
  );
}
