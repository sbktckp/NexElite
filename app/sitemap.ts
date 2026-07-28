import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { CASE_STUDIES } from "@/lib/work";

/**
 * Grows on its own. Every case study added to lib/work.ts appears here
 * without anyone remembering to update a list.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "monthly", priority: 1 },
    ...CASE_STUDIES.map((study) => ({
      url: `${SITE_URL}/work/${study.slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
