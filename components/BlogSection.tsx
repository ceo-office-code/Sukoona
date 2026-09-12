import Link from "next/link";
import { ARTICLES, readingMinutes } from "@/lib/blog";

export function BlogCards({ headingLevel = "h3" }: { headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <div className="blog-grid">
      {ARTICLES.map((article, index) => (
        <article key={article.slug} className="blog-card">
          <div className="blog-card-top"><span>{article.category}</span><span className="blog-card-number">0{index + 1}</span></div>
          <div className="blog-card-body">
            <Heading><Link href={`/blog/${article.slug}`}>{article.title}</Link></Heading>
            <p>{article.excerpt}</p>
            <div className="blog-card-footer"><span>{readingMinutes(article)} min read</span><Link href={`/blog/${article.slug}`} aria-label={`Read ${article.title}`}>Read story <span aria-hidden="true">↗</span></Link></div>
          </div>
        </article>
      ))}
    </div>
  );
}
export default function BlogSection() {
  return (
    <section id="journal" aria-labelledby="journal-heading">
      <div className="section-heading-row">
        <div><p className="eyebrow">THE SUKOONA JOURNAL</p><h2 id="journal-heading" className="section-title">A few thoughtful reads.</h2></div>
        <Link href="/blog" className="text-link">Explore the journal ↗</Link>
      </div>
      <BlogCards />
    </section>
  );
}
