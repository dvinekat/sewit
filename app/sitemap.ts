import type { MetadataRoute } from "next";

import { LEGAL_DOC_SLUGS } from "@/lib/legal-documents";
import { listPublishedPatterns } from "@/lib/patterns";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const patterns = await listPublishedPatterns();
  const lastModified = new Date("2026-11-13");

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: new URL("/", site.url).toString(),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/catalog", site.url).toString(),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: new URL("/help/printing", site.url).toString(),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Правовые страницы должны быть в sitemap: их индексируют роботы (T-44).
  const legalRoutes: MetadataRoute.Sitemap = LEGAL_DOC_SLUGS.map((doc) => ({
    url: new URL(`/legal/${doc}`, site.url).toString(),
    lastModified,
    changeFrequency: "yearly",
    priority: 0.3,
  }));

  // В sitemap попадают только опубликованные выкройки (FR-8.2, T-15).
  const patternRoutes: MetadataRoute.Sitemap = patterns.map((pattern) => ({
    url: new URL(`/patterns/${pattern.slug}`, site.url).toString(),
    lastModified: pattern.publishedAt ?? undefined,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...legalRoutes, ...patternRoutes];
}
