import type { Metadata } from "next";
import { BlogCards } from "@/components/BlogSection";
import { SITE_ORIGIN } from "@/lib/site";
export const metadata: Metadata = {
  title: "The Journal — Everyday rituals & thoughtful choices",
  description: "Read the Sukoona journal: simple evening rituals, a closer look at gummy packaging, and quiet corners made with what you own.",
  alternates: { canonical: `${SITE_ORIGIN}/blog` },
};
export default function Blog() {
  return (
    <main id="main-content" className="journal-page">
      <header className="journal-intro">
        <p className="eyebrow">THE SUKOONA JOURNAL</p>
        <h1>Make room<br /><em>for the little things.</em></h1>
        <p>Everyday rituals, thoughtful choices, and small ways to make a moment your own.</p>
      </header>
      <BlogCards headingLevel="h2" />
    </main>
  );
}
