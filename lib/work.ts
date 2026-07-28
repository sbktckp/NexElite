/* ──────────────────────────────────────────────────────────────────────────
   Case studies.

   This is the proof beat. The hero makes a claim, the stats put a number on
   it, and this is where the number gets itemised. Every stat on the page
   should be traceable to entries in here.

   Deliberately empty. Nothing in this file is invented. The moment real
   case studies land, fill the array and both the inline teasers and the
   /work/[slug] routes light up on their own. Until then the section hides
   itself rather than shipping filler.

   Fill one entry per project. Keep results honest and specific. A number
   you cannot source does not go in.
   ────────────────────────────────────────────────────────────────────────── */

export type CaseStudy = {
  /** URL segment. Lowercase, hyphenated. */
  slug: string;
  /** Client or brand name as they want it written. */
  client: string;
  /** One line for the teaser card. What you did, plainly. */
  summary: string;
  /** Which of the eight channels this ran through. Matches lib/services. */
  channel: string;
  /** Cover image in /public. 3:2, ideally under 200kb as AVIF or WebP. */
  cover: string;
  /** Alt text. Required, describe what is actually in the frame. */
  coverAlt: string;
  /** What the client was up against before you started. */
  challenge: string;
  /** The thinking. Why this approach and not another. */
  strategy: string;
  /** What actually got made and shipped. */
  execution: string;
  /**
   * Measured outcomes. Each one must be verifiable if a prospect asks.
   * These roll up into the headline stats, so keep them consistent.
   */
  results: { metric: string; value: string; note?: string }[];
  /** Optional pull quote from the client. Needs their sign off. */
  quote?: { text: string; attribution: string; role: string };
  /** Additional media for the detail page. */
  media?: { src: string; alt: string; kind: "image" | "video" }[];
};

export const CASE_STUDIES: CaseStudy[] = [];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((c) => c.slug === slug);
}
