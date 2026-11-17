import Link from "next/link";
import type { ReactNode, Ref } from "react";

export function AuthLayout({ eyebrow, title, description, children, titleRef }: { eyebrow: string; title: string; description: string; children?: ReactNode; titleRef?: Ref<HTMLHeadingElement> }) {
  return (
    <main className="auth-page">
      <div className="auth-container">
        <Link href="/" className="auth-brand">zi<span>co</span></Link>
        <section className="auth-card">
          <p className="auth-eyebrow">{eyebrow}</p>
          <h1 ref={titleRef} tabIndex={titleRef ? -1 : undefined} className="auth-title">{title}</h1>
          <p className="auth-description">{description}</p>
          {children}
        </section>
      </div>
    </main>
  );
}
