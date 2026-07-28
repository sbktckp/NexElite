/* ──────────────────────────────────────────────────────────────────────────
   Site constants.

   One place for anything that appears in metadata, structured data, the
   sitemap and the footer. Change the domain here and every one of those
   updates together.

   SITE_URL must be the real production origin before launch. Metadata,
   canonical URLs, Open Graph images and the sitemap all resolve against
   it, and a wrong value here silently breaks every one of them.
   ────────────────────────────────────────────────────────────────────────── */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexelite.media";

export const SITE = {
  name: "NexElite Media",
  /** Used as the default page title and in structured data. */
  title: "NexElite Media — Creative Media Agency",
  /**
   * Kept to roughly 150 characters so search engines do not truncate it,
   * and written as a claim rather than a list of adjectives.
   */
  description:
    "We turn noise into signal. Reels, campaigns and brand content that people actually stop to watch. 40M+ views delivered across 60+ brands.",
  email: "nexelitemedia@gmail.com",
  /**
   * Fill these in before launch. Empty strings are skipped in structured
   * data rather than emitted as broken links.
   */
  social: {
    instagram: "",
    linkedin: "",
    youtube: "",
  },
} as const;

/** Organization structured data. Helps the brand panel in search results. */
export function organizationJsonLd() {
  const sameAs = Object.values(SITE.social).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE_URL,
    description: SITE.description,
    email: SITE.email,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}
