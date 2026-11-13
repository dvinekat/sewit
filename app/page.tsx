import type { Metadata } from "next";

import { AboutSection } from "@/components/home/about-section";
import { Benefits } from "@/components/home/benefits";
import { CategoriesSection } from "@/components/home/categories-section";
import { CtaBand } from "@/components/home/cta-band";
import { FeaturedPatterns } from "@/components/home/featured-patterns";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { getFeaturedPatterns, listCategoriesWithCounts } from "@/lib/patterns";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

/** ISR-запас на будущее: когда подборка пойдёт из Supabase, страница обновится в фоне. */
export const revalidate = 3600;

export default async function HomePage() {
  const [featuredPatterns, categories] = await Promise.all([
    getFeaturedPatterns(6),
    listCategoriesWithCounts(),
  ]);

  return (
    <>
      <Hero />
      <Benefits />
      <CategoriesSection categories={categories} />
      <FeaturedPatterns patterns={featuredPatterns} categories={categories} />
      <HowItWorks />
      <AboutSection />
      <CtaBand />
    </>
  );
}
