import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "/", priority: 1, changeFrequency: "weekly" as const },
    { path: "/catalog", priority: 0.8, changeFrequency: "weekly" as const },
  ];

  return routes.map((route) => ({
    url: new URL(route.path, site.url).toString(),
    lastModified: new Date("2026-11-13"),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
