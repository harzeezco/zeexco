import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter } from "./site-footer";

type LegalLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function LegalLayout({ eyebrow, title, description, children }: LegalLayoutProps) {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link className="brand" href="/" aria-label="Zeexco home">
          ZEEXCO<span aria-hidden="true">.</span>
        </Link>
        <Link className="back-link" href="/">Back to home</Link>
      </header>

      <main className="legal-main">
        <header className="legal-intro">
          <p className="legal-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="legal-description">{description}</p>
          <p className="updated-date">Last updated: 8 November 2026</p>
        </header>
        <article className="legal-content">{children}</article>
      </main>

      <SiteFooter className="legal-footer" />
    </div>
  );
}
