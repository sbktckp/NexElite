"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";

const MAIL = "mailto:nexelitemedia@gmail.com";

/* ══ Offer bar ═══════════════════════════════════════════════════════════
   Lives inside the masthead rather than as its own fixed element, so the
   page still carries exactly one piece of top chrome. Date gated, so it
   removes itself on 1 September without anyone having to remember. */

const OFFER_START = new Date("2026-08-01T00:00:00+05:30");
const OFFER_END = new Date("2026-09-01T00:00:00+05:30");

export function OfferBar() {
  const [open, setOpen] = useState(true);
  const live = useMemo(() => {
    const now = new Date();
    return now >= OFFER_START && now < OFFER_END;
  }, []);

  if (!live || !open) return null;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(90deg, rgba(255,90,60,0.16), rgba(139,124,255,0.16), rgba(53,208,216,0.16))",
        borderBottom: "1px solid var(--rule)",
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center gap-3 sm:gap-5 px-5 sm:px-6 py-2 overflow-x-auto">
        <span
          className="font-tech text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap"
          style={{ color: "var(--accent)" }}
        >
          Independence Month
        </span>
        <span className="hidden sm:inline h-3 w-px shrink-0" style={{ background: "var(--rule-strong)" }} />
        <span
          className="flex items-center gap-2.5 text-[11px] sm:text-xs whitespace-nowrap"
          style={{ color: "var(--ink)" }}
        >
          <b>1 Year 50% off</b>
          <span style={{ color: "var(--muted)" }}>/</span>
          <b>6 Months 30% off</b>
          <span style={{ color: "var(--muted)" }}>/</span>
          <b>3 Months 20% off</b>
        </span>
        <span className="hidden md:inline text-[11px] whitespace-nowrap" style={{ color: "var(--muted)" }}>
          Valid till 31 August
        </span>
        <a
          href={MAIL}
          className="ml-auto shrink-0 flex items-center gap-1 text-[11px] font-bold px-3.5 py-1.5 rounded-full whitespace-nowrap"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          Claim offer <ArrowUpRight className="w-3 h-3" />
        </a>
        <button
          onClick={() => setOpen(false)}
          aria-label="Dismiss offer"
          className="shrink-0 text-sm leading-none px-1"
          style={{ color: "var(--muted)" }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

/* ══ Plans ═══════════════════════════════════════════════════════════════
   Every field the brief asked for, on every card, so a visitor can decide
   without contacting anyone first. Prices read as "from" because scope
   moves them, and quoting a firm number we would then renegotiate is worse
   than quoting none. */

type Plan = {
  id: string;
  name: string;
  tag: string;
  from: string;
  tone: string;
  duration: string;
  creators: string;
  deliverables: string[];
  support: string;
  outcome: string;
  bestFor: string;
};

const PLANS: Plan[] = [
  {
    id: "creator-growth",
    name: "Creator Growth",
    tag: "For creators",
    from: "Managed roster",
    tone: "var(--accent-2)",
    duration: "3 to 12 months",
    creators: "You, managed end to end",
    deliverables: [
      "Content strategy and hooks",
      "12 to 20 reels a month",
      "Editing, captions, grading",
      "Posting calendar and trend calls",
    ],
    support: "Weekly review call, monthly performance report",
    outcome: "Compounding reach and a profile brands want to pay for",
    bestFor: "Doctors, med students and lifestyle creators building a name",
  },
  {
    id: "influencer",
    name: "Influencer Marketing",
    tag: "For brands",
    from: "Per campaign",
    tone: "var(--accent-3)",
    duration: "4 to 8 weeks per campaign",
    creators: "5 to 40 creators, nano to macro",
    deliverables: [
      "Creator shortlisting and vetting",
      "Brief, script and approval loop",
      "Reels, stories and collabs",
      "Usage rights and whitelisting",
    ],
    support: "Dedicated campaign manager",
    outcome: "Measured reach, saves and profile visits against a set budget",
    bestFor: "Brands that need proof, not just posts",
  },
  {
    id: "d2c",
    name: "D2C Growth",
    tag: "For brands",
    from: "Retainer",
    tone: "var(--accent)",
    duration: "6 months minimum",
    creators: "Creator pod plus in house production",
    deliverables: [
      "Full funnel content",
      "UGC library refreshed monthly",
      "Landing page and offer testing",
      "Retention and email hooks",
    ],
    support: "Fortnightly strategy, monthly performance review",
    outcome: "Revenue scaled with contribution margin held",
    bestFor: "Skincare, health and wellness brands past first traction",
  },
  {
    id: "performance",
    name: "Performance Marketing",
    tag: "For brands",
    from: "Retainer plus ad spend",
    tone: "var(--accent-2)",
    duration: "3 months minimum",
    creators: "Creative pod of 3 to 6",
    deliverables: [
      "Meta and Google campaign builds",
      "15 to 30 creatives a month",
      "Pixel, events and attribution setup",
      "Weekly iteration on winners",
    ],
    support: "Weekly reporting, live dashboard",
    outcome: "ROAS you can defend, with the creative that moved it named",
    bestFor: "Brands already spending and not sure what is working",
  },
  {
    id: "branding",
    name: "Branding",
    tag: "For brands",
    from: "Project",
    tone: "var(--accent-3)",
    duration: "4 to 8 weeks",
    creators: "Strategy and design team",
    deliverables: [
      "Positioning and messaging",
      "Identity system and guidelines",
      "Social templates and tone of voice",
      "Launch content kit",
    ],
    support: "Two rounds of revision at each stage",
    outcome: "One coherent brand instead of six inconsistent channels",
    bestFor: "Clinics, institutes and founders being taken less seriously than they should be",
  },
  {
    id: "web",
    name: "Website Development",
    tag: "For brands",
    from: "Project",
    tone: "var(--accent)",
    duration: "3 to 6 weeks",
    creators: "Design and engineering",
    deliverables: [
      "Design and build",
      "Mobile first, Core Web Vitals green",
      "SEO, metadata and analytics",
      "Lead capture wired to your inbox",
    ],
    support: "30 days post launch support",
    outcome: "A site that converts the traffic you already pay for",
    bestFor: "Anyone whose site is slower and older than their business",
  },
];

export function Plans() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {PLANS.map((p) => (
        <article key={p.id} className="surface motion-tile lift p-6 flex flex-col text-left">
          <div className="flex items-center justify-between mb-4">
            <span
              className="font-tech text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: p.tone }}
            >
              {p.tag}
            </span>
            <span
              className="font-tech text-[10px] uppercase tracking-[0.14em]"
              style={{ color: "var(--muted)" }}
            >
              {p.from}
            </span>
          </div>

          <h3 className="font-disp text-2xl mb-4" style={{ color: "var(--ink)", fontWeight: 700 }}>
            {p.name}
          </h3>

          <dl className="text-xs space-y-2.5 mb-4">
            <div>
              <dt
                className="font-tech uppercase tracking-[0.14em] text-[9px] mb-0.5"
                style={{ color: "var(--muted)" }}
              >
                Duration
              </dt>
              <dd style={{ color: "var(--body)" }}>{p.duration}</dd>
            </div>
            <div>
              <dt
                className="font-tech uppercase tracking-[0.14em] text-[9px] mb-0.5"
                style={{ color: "var(--muted)" }}
              >
                Creators
              </dt>
              <dd style={{ color: "var(--body)" }}>{p.creators}</dd>
            </div>
            <div>
              <dt
                className="font-tech uppercase tracking-[0.14em] text-[9px] mb-1"
                style={{ color: "var(--muted)" }}
              >
                Deliverables
              </dt>
              <dd>
                <ul className="space-y-1">
                  {p.deliverables.map((d) => (
                    <li key={d} className="flex gap-2" style={{ color: "var(--body)" }}>
                      <span style={{ color: p.tone }}>/</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt
                className="font-tech uppercase tracking-[0.14em] text-[9px] mb-0.5"
                style={{ color: "var(--muted)" }}
              >
                Support
              </dt>
              <dd style={{ color: "var(--body)" }}>{p.support}</dd>
            </div>
          </dl>

          <div className="rule pt-3 mt-auto">
            <p className="text-xs mb-1" style={{ color: "var(--ink)" }}>
              <b>Outcome.</b> {p.outcome}
            </p>
            <p className="text-[11px] mb-4" style={{ color: "var(--muted)" }}>
              Best for {p.bestFor}
            </p>
            <a
              href={MAIL}
              className="flex items-center justify-center gap-1.5 text-xs font-bold px-5 py-2.5 rounded-full w-full"
              style={{ background: "var(--ink)", color: "var(--paper)" }}
            >
              Start with {p.name} <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ══ Creator network ═════════════════════════════════════════════════════
   TODO: `er` is a placeholder range on every card below. Replace with real
   numbers from the roster before this is promoted, or delete the field.
   Everything else here is true. */

type Creator = {
  name: string;
  handle: string;
  tier: "Nano" | "Micro" | "Mid" | "Macro";
  platform: "Instagram" | "YouTube";
  category: string;
  followers: string;
  bucket: number;
  er: string;
  city: string;
  style: string;
};

const CREATORS: Creator[] = [
  { name: "Ashmeet", handle: "@ashmeet", tier: "Micro", platform: "Instagram", category: "Lifestyle", followers: "53K", bucket: 10, er: "4 to 6%", city: "Delhi", style: "Talking head, fast cut" },
  { name: "Rahul", handle: "@rahul", tier: "Micro", platform: "Instagram", category: "Fitness", followers: "13K", bucket: 10, er: "5 to 7%", city: "Mumbai", style: "Transformation, POV" },
  { name: "Pranjali", handle: "@pranjali", tier: "Micro", platform: "Instagram", category: "Lifestyle", followers: "12K", bucket: 10, er: "6 to 8%", city: "Pune", style: "Aesthetic vlog" },
  { name: "Dr. A", handle: "@drA", tier: "Micro", platform: "Instagram", category: "Healthcare", followers: "28K", bucket: 10, er: "4 to 6%", city: "Delhi", style: "Myth busting, explainer" },
  { name: "Dr. S", handle: "@drS", tier: "Nano", platform: "Instagram", category: "Healthcare", followers: "8K", bucket: 1, er: "7 to 9%", city: "Bengaluru", style: "Clinic behind the scenes" },
  { name: "Med student M", handle: "@medM", tier: "Nano", platform: "Instagram", category: "Education", followers: "6K", bucket: 1, er: "6 to 9%", city: "Kolkata", style: "Study with me" },
  { name: "Skincare K", handle: "@skinK", tier: "Mid", platform: "Instagram", category: "Beauty", followers: "180K", bucket: 100, er: "3 to 5%", city: "Mumbai", style: "Routine, review" },
  { name: "Creator Y", handle: "@yTube", tier: "Mid", platform: "YouTube", category: "Education", followers: "120K", bucket: 100, er: "3 to 5%", city: "Hyderabad", style: "Long form breakdown" },
];

const CATS = ["All", "Healthcare", "Lifestyle", "Fitness", "Beauty", "Education"];
const PLATS = ["All", "Instagram", "YouTube"];
const SIZES = [
  { label: "All", bucket: 0 },
  { label: "Under 10K", bucket: 1 },
  { label: "10K to 100K", bucket: 10 },
  { label: "100K plus", bucket: 100 },
];

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className="font-tech text-[10px] uppercase tracking-[0.14em] px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
      style={{
        color: on ? "var(--paper)" : "var(--body)",
        background: on ? "var(--ink)" : "var(--paper-2)",
        border: "1px solid var(--rule)",
      }}
    >
      {children}
    </button>
  );
}

export function CreatorNetwork() {
  const [cat, setCat] = useState("All");
  const [plat, setPlat] = useState("All");
  const [size, setSize] = useState("All");

  const shown = CREATORS.filter((c) => {
    if (cat !== "All" && c.category !== cat) return false;
    if (plat !== "All" && c.platform !== plat) return false;
    if (size !== "All") {
      const s = SIZES.find((x) => x.label === size);
      if (s && c.bucket !== s.bucket) return false;
    }
    return true;
  });

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex flex-wrap gap-1.5">
          {CATS.map((c) => (
            <Chip key={c} on={cat === c} onClick={() => setCat(c)}>
              {c}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PLATS.map((p) => (
            <Chip key={p} on={plat === p} onClick={() => setPlat(p)}>
              {p}
            </Chip>
          ))}
          {SIZES.map((s) => (
            <Chip key={s.label} on={size === s.label} onClick={() => setSize(s.label)}>
              {s.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {shown.map((c) => (
          <article key={c.handle} className="surface motion-tile p-5 text-left">
            <div className="flex items-center justify-between mb-3">
              <span
                className="font-tech text-[9px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-full"
                style={{ color: "var(--accent-2)", border: "1px solid var(--rule)" }}
              >
                {c.tier}
              </span>
              <span
                className="font-tech text-[9px] uppercase tracking-[0.14em]"
                style={{ color: "var(--muted)" }}
              >
                {c.platform}
              </span>
            </div>
            <p className="font-disp text-lg mb-0.5" style={{ color: "var(--ink)", fontWeight: 700 }}>
              {c.name}
            </p>
            <p className="font-tech text-[10px] mb-3" style={{ color: "var(--muted)" }}>
              {c.handle}
            </p>
            <p className="figure text-2xl mb-3" style={{ color: "var(--ink)" }}>
              {c.followers}
            </p>
            <dl className="text-[11px] space-y-1" style={{ color: "var(--body)" }}>
              <div className="flex justify-between gap-2">
                <dt style={{ color: "var(--muted)" }}>Niche</dt>
                <dd>{c.category}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt style={{ color: "var(--muted)" }}>Avg ER</dt>
                <dd>{c.er}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt style={{ color: "var(--muted)" }}>Base</dt>
                <dd>{c.city}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt style={{ color: "var(--muted)" }}>Style</dt>
                <dd className="text-right">{c.style}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="text-sm py-10 text-center" style={{ color: "var(--muted)" }}>
          Nothing matches that combination yet. Widen a filter, or ask us directly.
        </p>
      )}
    </div>
  );
}

/* ══ Brand audit ═════════════════════════════════════════════════════════
   Honest by construction. Nothing running in a browser can read an Instagram
   account or crawl a site, so this does not pretend to. It takes the URL or
   handle for the lead, then scores eight signals the visitor reports
   themselves, weights them, and returns a diagnostic. The disclaimer says
   exactly that, because a fake crawl is the fastest way to lose the trust
   this section exists to build. */

type Q = { id: string; text: string; weight: number; area: string };

const QUESTIONS: Q[] = [
  { id: "site", text: "Do you have a website that loads fast on mobile?", weight: 14, area: "Website experience" },
  { id: "brand", text: "Is your logo, colour and tone the same everywhere?", weight: 12, area: "Brand consistency" },
  { id: "cadence", text: "Do you publish at least 8 pieces of content a month?", weight: 14, area: "Content consistency" },
  { id: "bio", text: "Does your Instagram bio state what you do and a clear next step?", weight: 10, area: "Profile optimisation" },
  { id: "proof", text: "Do you show testimonials, results or client logos publicly?", weight: 14, area: "Trust and social proof" },
  { id: "cta", text: "Is there one obvious action a new visitor should take?", weight: 12, area: "CTA effectiveness" },
  { id: "creator", text: "Have you run a creator campaign in the last 6 months?", weight: 12, area: "Creator distribution" },
  { id: "track", text: "Can you name which content drove your last 10 enquiries?", weight: 12, area: "Measurement" },
];

export function BrandAudit() {
  const [who, setWho] = useState("");
  const [ans, setAns] = useState<Record<string, boolean | undefined>>({});
  const [done, setDone] = useState(false);

  const answered = QUESTIONS.filter((q) => ans[q.id] !== undefined).length;
  const score = QUESTIONS.reduce((n, q) => n + (ans[q.id] ? q.weight : 0), 0);

  const strengths = QUESTIONS.filter((q) => ans[q.id] === true);
  const gaps = QUESTIONS.filter((q) => ans[q.id] === false);
  const critical = gaps.filter((q) => q.weight >= 14);
  const improve = gaps.filter((q) => q.weight < 14);

  const band =
    score >= 80
      ? "Strong. The gaps left are optimisation, not foundation."
      : score >= 55
        ? "Workable. The foundation is there and the distribution is not."
        : score >= 30
          ? "Fragmented. Real effort going into channels that are not compounding."
          : "Early. Almost everything here is upside.";

  if (done) {
    const buckets = [
      { icon: "🟢", title: "Strengths", items: strengths, note: "Keep these, they are doing work." },
      { icon: "🔴", title: "Critical gaps", items: critical, note: "Fix these first, they cap everything else." },
      { icon: "🟡", title: "Areas to improve", items: improve, note: "Worth a pass once the critical gaps close." },
    ];

    return (
      <div className="surface p-7 sm:p-9 w-full max-w-3xl mx-auto text-left">
        <p className="kicker mb-5">Your diagnostic</p>
        <div className="flex items-end gap-4 mb-2">
          <p className="figure text-6xl sm:text-7xl" style={{ color: "var(--ink)" }}>
            {score}
          </p>
          <p className="figure text-2xl mb-2" style={{ color: "var(--muted)" }}>
            /100
          </p>
        </div>
        <div
          className="h-1.5 w-full rounded-full mb-4 overflow-hidden"
          style={{ background: "var(--paper-2)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${score}%`,
              background: "linear-gradient(90deg, var(--accent), var(--accent-3), var(--accent-2))",
            }}
          />
        </div>
        <p className="text-base mb-8" style={{ color: "var(--body)" }}>
          {band}
        </p>

        {buckets.map(
          (b) =>
            b.items.length > 0 && (
              <div key={b.title} className="mb-6">
                <p className="font-disp text-lg mb-2" style={{ color: "var(--ink)", fontWeight: 700 }}>
                  {b.icon} {b.title}
                </p>
                <ul className="space-y-1 mb-1">
                  {b.items.map((q) => (
                    <li key={q.id} className="text-sm flex gap-2" style={{ color: "var(--body)" }}>
                      <span style={{ color: "var(--muted)" }}>/</span>
                      {q.area}
                    </li>
                  ))}
                </ul>
                <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                  {b.note}
                </p>
              </div>
            )
        )}

        <div className="rule pt-5 mt-2">
          <p className="text-[11px] mb-5" style={{ color: "var(--muted)" }}>
            This is an initial diagnostic based on the signals you reported, not a
            complete audit. A full audit reviews your live site, analytics and
            account data.
          </p>
          <a
            href={`${MAIL}?subject=${encodeURIComponent("Brand audit follow up")}&body=${encodeURIComponent(
              `Brand: ${who}\nSelf reported score: ${score}/100\nGaps: ${gaps.map((g) => g.area).join(", ")}`
            )}`}
            className="inline-flex items-center gap-2 text-sm font-bold px-7 py-3.5 rounded-full"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Want us to fix these gaps? Talk to the growth team{" "}
            <ArrowUpRight className="w-4 h-4" />
          </a>
          <button
            onClick={() => {
              setDone(false);
              setAns({});
            }}
            className="block mt-4 font-tech text-[10px] uppercase tracking-[0.16em]"
            style={{ color: "var(--muted)" }}
          >
            Run it again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="surface p-7 sm:p-9 w-full max-w-3xl mx-auto text-left">
      <label className="block mb-6">
        <span
          className="font-tech text-[10px] uppercase tracking-[0.18em] block mb-2"
          style={{ color: "var(--muted)" }}
        >
          Website or Instagram handle
        </span>
        <input
          value={who}
          onChange={(e) => setWho(e.target.value)}
          placeholder="yourbrand.com or @yourbrand"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ background: "var(--paper-2)", border: "1px solid var(--rule)", color: "var(--ink)" }}
        />
      </label>

      <div className="space-y-2 mb-6">
        {QUESTIONS.map((q) => (
          <div key={q.id} className="flex items-center justify-between gap-4 py-2.5 rule">
            <p className="text-sm" style={{ color: "var(--body)" }}>
              {q.text}
            </p>
            <div className="flex gap-1.5 shrink-0">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  onClick={() => setAns((a) => ({ ...a, [q.id]: v }))}
                  aria-pressed={ans[q.id] === v}
                  className="font-tech text-[10px] uppercase tracking-[0.14em] px-3 py-1.5 rounded-full"
                  style={{
                    color: ans[q.id] === v ? "var(--paper)" : "var(--body)",
                    background: ans[q.id] === v ? "var(--ink)" : "var(--paper-2)",
                    border: "1px solid var(--rule)",
                  }}
                >
                  {v ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        disabled={!who.trim() || answered < QUESTIONS.length}
        onClick={() => setDone(true)}
        className="w-full flex items-center justify-center gap-2 text-sm font-bold px-7 py-3.5 rounded-full disabled:opacity-40"
        style={{ background: "var(--ink)", color: "var(--paper)" }}
      >
        {answered < QUESTIONS.length ? (
          `${QUESTIONS.length - answered} left`
        ) : (
          <>
            Generate my brand score <ArrowUpRight className="w-4 h-4" />
          </>
        )}
      </button>
      <p className="text-[11px] mt-3 text-center" style={{ color: "var(--muted)" }}>
        Based on publicly observable signals you report. An initial diagnostic, not a
        guaranteed complete audit.
      </p>
    </div>
  );
}
