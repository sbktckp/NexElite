import {
  Sparkles,
  ShoppingBag,
  Gift,
  Users,
  Store,
  TrendingUp,
  Share2,
  Globe,
  type LucideIcon,
} from "lucide-react";

export interface ServiceKPI {
  value: string;
  label: string;
}

export interface Service {
  id: string;
  icon: LucideIcon;
  name: string;
  tagline: string;
  description: string;
  kpis: ServiceKPI[];
  ctaLabel: string;
  ctaSubject: string;
  tone: string;
}

export const SERVICES: Service[] = [
  {
    id: "creators-plan",
    icon: Sparkles,
    name: "Creators plan",
    tagline: "Built for people, not just brands",
    description:
      "A content system for individual creators — consistent output, a voice that holds together, and a growth plan instead of random posting.",
    kpis: [
      { value: "3.2x", label: "avg. follower growth / 90 days" },
      { value: "22", label: "pieces of content / month" },
      { value: "14", label: "active creator accounts" },
    ],
    ctaLabel: "Start my creator plan",
    ctaSubject: "Creators plan — let's talk",
    tone: "#2F5D7C",
  },
  {
    id: "d2c",
    icon: ShoppingBag,
    name: "D2C",
    tagline: "Content that sells, not just performs",
    description:
      "Full-funnel content for direct-to-consumer brands — product hero shots, UGC-style ads, and landing creative built to convert traffic into orders.",
    kpis: [
      { value: "2.8x", label: "avg. ROAS on paid creative" },
      { value: "18%", label: "lift in add-to-cart rate" },
      { value: "9", label: "D2C brands served" },
    ],
    ctaLabel: "Get a D2C proposal",
    ctaSubject: "D2C content — request a proposal",
    tone: "#7EC8E3",
  },
  {
    id: "extras",
    icon: Gift,
    name: "Extra's",
    tagline: "The odd jobs every brand actually needs",
    description:
      "One-off shoots, quick-turn edits, thumbnail packs, and the small creative asks that don't fit a retainer but still need to look right.",
    kpis: [
      { value: "48hr", label: "avg. turnaround" },
      { value: "120+", label: "one-off jobs delivered" },
      { value: "0", label: "minimum commitment" },
    ],
    ctaLabel: "Send a quick brief",
    ctaSubject: "Extra's — one-off request",
    tone: "#2F5D7C",
  },
  {
    id: "influencer-marketing",
    icon: Users,
    name: "Influencer marketing",
    tagline: "Matched creators, managed end to end",
    description:
      "Creator sourcing, briefing, and campaign management — we handle outreach and deliverables so the partnership actually lands on-brand.",
    kpis: [
      { value: "6M+", label: "campaign reach delivered" },
      { value: "40+", label: "creators in our network" },
      { value: "4.6%", label: "avg. engagement rate" },
    ],
    ctaLabel: "Plan a campaign",
    ctaSubject: "Influencer marketing — campaign inquiry",
    tone: "#7EC8E3",
  },
  {
    id: "local-business",
    icon: Store,
    name: "Local business",
    tagline: "Get found in your own neighborhood",
    description:
      "Local SEO-aware content, Google Business presence, and simple, consistent social for businesses that live or die by local footfall.",
    kpis: [
      { value: "35%", label: "avg. lift in local search views" },
      { value: "25+", label: "local businesses onboarded" },
      { value: "4.8★", label: "avg. client review score" },
    ],
    ctaLabel: "Grow my local presence",
    ctaSubject: "Local business — get started",
    tone: "#2F5D7C",
  },
  {
    id: "performance-marketing",
    icon: TrendingUp,
    name: "Performance marketing",
    tagline: "Media buying that's actually accountable",
    description:
      "Paid campaigns across Meta, Google, and TikTok — built, tracked, and optimized against CPA and ROAS, not vanity impressions.",
    kpis: [
      { value: "3.1x", label: "avg. ROAS across accounts" },
      { value: "22%", label: "avg. CPA reduction" },
      { value: "₹2Cr+", label: "ad spend managed" },
    ],
    ctaLabel: "Audit my ad spend",
    ctaSubject: "Performance marketing — request an audit",
    tone: "#7EC8E3",
  },
  {
    id: "social-media-marketing",
    icon: Share2,
    name: "Social media marketing",
    tagline: "Calendars, community, and consistency",
    description:
      "Full social management — content calendars, posting, community replies, and monthly reporting so your feed actually compounds.",
    kpis: [
      { value: "2.4x", label: "avg. engagement growth" },
      { value: "30", label: "posts scheduled / month" },
      { value: "16", label: "brands managed" },
    ],
    ctaLabel: "Hand off my socials",
    ctaSubject: "Social media marketing — management inquiry",
    tone: "#2F5D7C",
  },
  {
    id: "website-plans",
    icon: Globe,
    name: "Website plans",
    tagline: "A site that matches the content",
    description:
      "Landing pages and full sites built to match your brand's actual visual identity — not a template with your logo dropped on top.",
    kpis: [
      { value: "1.8s", label: "avg. load time" },
      { value: "12", label: "sites shipped" },
      { value: "100", label: "Lighthouse score target" },
    ],
    ctaLabel: "Start my website",
    ctaSubject: "Website plans — project inquiry",
    tone: "#7EC8E3",
  },
];
