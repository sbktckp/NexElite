import type { LucideIcon } from "lucide-react";
import {
  Droplets,
  HeartPulse,
  GraduationCap,
  Building2,
  Stethoscope,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────────────────
   Impact data.

   Everything in this file was supplied by the agency, not invented here.
   The creator growth numbers are the three stories provided verbatim
   (starting followers, ending followers, timeframe). The client case
   studies are the agency's own copy, edited only for length and to follow
   the agency's own credibility rule: no revenue figure appears unless it
   can be documented, so scaling is described as multi crore rather than as
   an exact number.

   If a claim in here cannot be sourced when a prospect asks, remove it.
   ────────────────────────────────────────────────────────────────────────── */

export type CreatorGrowth = {
  /** First name only. Full handles stay out of the marketing site. */
  name: string;
  niche: string;
  /** Followers when the engagement started. */
  from: number;
  /** Followers at the end of the stated window. */
  to: number;
  /** The window, exactly as the agency states it. */
  window: string;
};

export const CREATOR_GROWTH: CreatorGrowth[] = [
  {
    name: "Ashmeet",
    niche: "Creator",
    from: 6200,
    to: 53000,
    window: "2 months",
  },
  {
    name: "Rahul",
    niche: "Creator",
    from: 2500,
    to: 13000,
    window: "1.5 months",
  },
  {
    name: "Pranjali",
    niche: "Creator",
    from: 400,
    to: 12000,
    window: "1.5 months",
  },
];

/** Roster context shown under the ledger. Aggregate, no individual handles. */
export const ROSTER_NOTE =
  "A managed roster of doctors, medical students, and lifestyle creators, several past the 10k mark and climbing.";

export type ClientCase = {
  id: string;
  icon: LucideIcon;
  client: string;
  sector: string;
  /** What the engagement was, in one breath. */
  brief: string;
  /** Chips. Keep to five or fewer so the card scans. */
  services: string[];
  /** Outcomes. Written to the agency's own credibility rule. */
  outcomes: string[];
  tone: string;
};

export const CLIENT_CASES: ClientCase[] = [
  {
    id: "seoul-root",
    icon: Droplets,
    client: "Seoul Root",
    sector: "D2C skincare",
    brief:
      "Performance driven marketing, creator collaborations, and brand positioning through the brand's scaling journey.",
    services: [
      "Brand strategy",
      "Influencer marketing",
      "Performance marketing",
      "Content planning",
    ],
    outcomes: [
      "Contributed to scaling revenue from an early stage to multi crore growth within months",
      "Built a stronger digital presence across major social platforms",
    ],
    tone: "#7EC8E3",
  },
  {
    id: "fidore-health",
    icon: HeartPulse,
    client: "Fidore Health",
    sector: "Healthcare and wellness",
    brief:
      "A credible healthcare brand built through educational content and digital campaigns centred on customer trust.",
    services: [
      "Healthcare marketing",
      "Brand positioning",
      "Performance ads",
      "Social media growth",
    ],
    outcomes: [
      "Strengthened brand authority in the healthcare space",
      "Significantly increased reach, engagement, and digital visibility over one year",
    ],
    tone: "#D9B98A",
  },
  {
    id: "iib-institute",
    icon: GraduationCap,
    client: "IIB Institute",
    sector: "Education",
    brief:
      "Admissions focused campaigns spanning branding, lead generation, and digital awareness.",
    services: [
      "Admission marketing",
      "Lead generation",
      "Social media management",
      "Creative campaigns",
    ],
    outcomes: [
      "Improved student inquiries and digital reach",
      "Stronger online reputation through consistent branding",
    ],
    tone: "#8FB7A5",
  },
  {
    id: "hospitals",
    icon: Building2,
    client: "Hospitals and clinics",
    sector: "Healthcare institutions",
    brief:
      "Patient facing campaigns that educate first and convert second, for hospitals, clinics, and specialist practices.",
    services: [
      "Hospital branding",
      "Patient awareness campaigns",
      "Video production",
      "Performance marketing",
    ],
    outcomes: [
      "Increased patient footfall",
      "Stronger trust built through educational healthcare content",
    ],
    tone: "#9A8FC7",
  },
  {
    id: "doctors",
    icon: Stethoscope,
    client: "Doctors and specialists",
    sector: "Personal branding",
    brief:
      "Digital identities for leading healthcare professionals through professional content and strategic branding.",
    services: [
      "Personal branding",
      "Medical content strategy",
      "Video production",
      "Reputation management",
    ],
    outcomes: [
      "Enhanced professional credibility",
      "Increased audience engagement and patient inquiries",
    ],
    tone: "#C79A8F",
  },
];
