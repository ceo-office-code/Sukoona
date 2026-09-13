import type { MetadataRoute } from "next";
import { ARTICLES, PUBLISHED } from "@/lib/blog";
import { SITE_ORIGIN } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_ORIGIN, lastModified: PUBLISHED },
    { url: `${SITE_ORIGIN}/blog`, lastModified: PUBLISHED },
    { url: `${SITE_ORIGIN}/contact`, lastModified: PUBLISHED },
    ...ARTICLES.map(a => ({ url: `${SITE_ORIGIN}/blog/${a.slug}`, lastModified: PUBLISHED })),
  ];
}
