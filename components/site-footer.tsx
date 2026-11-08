import Link from "next/link";

type SiteFooterProps = {
  className?: string;
  showContext?: boolean;
};

export function SiteFooter({ className = "", showContext = false }: SiteFooterProps) {
  return (
    <footer className={`site-footer ${className}`.trim()}>
      {showContext && (
        <p className="footer-context">For shops, sellers &amp; growing businesses</p>
      )}
      <nav aria-label="Legal and contact links">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/data-deletion">Data Deletion</Link>
        <a href="mailto:admin@zeexco.com">Contact</a>
      </nav>
    </footer>
  );
}
