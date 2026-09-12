"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import SiteHeader from "./SiteHeader";
import LeadCapture from "./LeadCapture";
export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = usePathname().startsWith("/admin");
  if (admin) return <>{children}</>;
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      {children}
      <LeadCapture />
      <footer className="site-footer">
        <div>
          <Link href="/" className="wordmark">
            sukoona
          </Link>
          <p>A little room for yourself.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/#concept">The jar</Link>
          <Link href="/blog">Journal</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
        <p className="footer-note">
          Product concept preview. Formulation and product details are being
          finalised. Nothing for sale.
        </p>
      </footer>
    </>
  );
}
