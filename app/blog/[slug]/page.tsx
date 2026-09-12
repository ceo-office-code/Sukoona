import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, PUBLISHED, readingMinutes, sectionId } from "@/lib/blog";
import { SITE_ORIGIN } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return ARTICLES.map(({ slug }) => ({ slug })); }
export const dynamicParams = false;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES.find(item => item.slug === slug);
  if (!article) return { title: "Story not found" };
  return { title: article.title, description: article.excerpt, alternates: { canonical: `${SITE_ORIGIN}/blog/${article.slug}` } };
}
export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = ARTICLES.find(item => item.slug === slug);
  if (!article) notFound();
  const next = ARTICLES[(ARTICLES.indexOf(article) + 1) % ARTICLES.length];
  const schema = {
    "@context": "https://schema.org", "@type": "BlogPosting",
    headline: article.title, description: article.excerpt,
    datePublished: PUBLISHED, dateModified: PUBLISHED,
    author: { "@type": "Organization", name: "Sukoona Journal" },
    publisher: { "@type": "Organization", name: "Sukoona" },
    mainEntityOfPage: `${SITE_ORIGIN}/blog/${article.slug}`,
    articleSection: article.category,
    articleBody: article.sections.map(s => s.heading + "\n" + s.paragraphs.join("\n")).join("\n\n"),
  };
  return (
    <main id="main-content" className="article-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/blog">Journal</Link><span aria-hidden="true">/</span><span aria-current="page">{article.category}</span></nav>
      <article>
        <header className="article-header">
          <p className="eyebrow">{article.category}</p>
          <h1>{article.title}</h1>
          <p className="article-excerpt">{article.excerpt}</p>
          <div className="article-meta"><span>Sukoona Journal</span><time dateTime={PUBLISHED}>12 September 2026</time><span>{readingMinutes(article)} min read</span></div>
        </header>
        <div className="article-layout">
          <nav className="article-toc" aria-label="On this page"><h2>In this story</h2>{article.sections.map((s,i) => <a key={s.heading} href={`#${sectionId(i)}`}>{s.heading}</a>)}</nav>
          <div className="article-body">
            {article.sections.map((section,index) => <section key={section.heading} id={sectionId(index)}><h2>{section.heading}</h2>{section.paragraphs.map(p => <p key={p}>{p}</p>)}</section>)}
            <p><Link className="text-link" href="/contact?via=journal">Have a question for Sukoona? Get in touch ↗</Link></p><div className="article-bottom"><Link className="text-link" href="/blog">← All stories</Link><Link className="text-link" href={`/blog/${next.slug}`}>Next story ↗</Link></div>
          </div>
        </div>
      </article>
    </main>
  );
}
