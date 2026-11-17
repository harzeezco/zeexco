import Image from "next/image";
import Link from "next/link";
import type { ReactNode, Ref } from "react";
import { AccountSwitch } from "./account-switch";

export function VerificationLayout({ eyebrow, title, description, children, titleRef, variant = "verification" }: { eyebrow: string; title: string; description: string; children: ReactNode; titleRef?: Ref<HTMLHeadingElement>; variant?: "verification" | "login" | "account" }) {
  return (
    <main className="verification-page">
      <aside className="verification-aside">
        <Link href="/" aria-label="Zico home" className="flex h-28 items-center"><Image src="/zico_logo.svg" alt="Zico" className="w-28" style={{ height: "auto" }} width={335} height={204} priority /></Link>
        <div className="verification-intro">
          <p className="verification-eyebrow">Built for everyday sellers</p>
          <h2>{variant !== "verification" ? <>Your business.<br />All together.</> : <>One last step.<br />Then, you’re in.</>}</h2>
          <p>{variant !== "verification" ? "Your products, customers and daily tasks, all in one place. Pick up right where you left off." : "We’re confirming your email so you can start bringing your products, customers and daily tasks together."}</p>
        </div>
      </aside>
      <section className="verification-main">
        <Link href="/" aria-label="Zico home" className="verification-mobile-brand"><Image src="/zico_logo.svg" alt="Zico" className="w-[90px]" style={{ height: "auto" }} width={335} height={204} priority /></Link>
        <div className="verification-content">
          {variant === "login" ? <AccountSwitch page="login" /> : null}
          <p className="verification-eyebrow">{eyebrow}</p>
          <h1 ref={titleRef} tabIndex={-1}>{title}</h1>
          <p className="verification-description">{description}</p>
          {children}
        </div>
        <footer className="verification-footer"><Link href="/terms">Terms</Link><span aria-hidden="true">·</span><Link href="/privacy">Privacy Policy</Link></footer>
      </section>
    </main>
  );
}
