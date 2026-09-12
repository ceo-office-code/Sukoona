import articles from "./articles.json";

export type Article = {
  title: string; slug: string; excerpt: string; category: string;
  sections: { heading: string; paragraphs: string[] }[];
};
export const ARTICLES: Article[] = articles;
export const PUBLISHED = "2026-09-12";
export function readingMinutes(article: Article) {
  const text = article.sections.flatMap(section => section.paragraphs).join(" ");
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 220));
}
export function sectionId(index: number) { return `section-${index + 1}`; }
