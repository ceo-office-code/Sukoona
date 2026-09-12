"use client";
import Link from "next/link";
import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("sukoona-theme", callback);
  return () => window.removeEventListener("sukoona-theme", callback);
}
export default function SiteHeader() {
  const dark = useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme !== "light", () => true);
  function toggleTheme() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("sukoona-theme", next); } catch { /* Theme works without storage. */ }
    window.dispatchEvent(new Event("sukoona-theme"));
  }
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="wordmark" aria-label="Sukoona home">sukoona</Link>
        <nav aria-label="Main navigation">
          <Link href="/#concept">The jar</Link>
          <Link href="/#ingredients" className="nav-ingredients">Botanicals</Link>
          <Link href="/blog">Journal</Link>
        </nav>
        <button type="button" role="switch" aria-checked={dark} aria-label="Dark theme" onClick={toggleTheme} className="theme-toggle" title={dark ? "Switch to light theme" : "Switch to dark theme"}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <span className="toggle-track" aria-hidden="true"><span /></span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 15.7A8.7 8.7 0 0 1 8.3 4a8.7 8.7 0 1 0 11.7 11.7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </header>
  );
}
