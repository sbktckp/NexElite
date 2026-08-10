"use client";

import { CLIENT_CASES } from "@/lib/impact";

/* ──────────────────────────────────────────────────────────────────────────
   ClientImpact.

   Five real engagements as cards. Layout is a deliberate 2 plus 3: the two
   named product brands with the strongest outcomes take the wide top row,
   the three practice areas sit under them. Reads as a hierarchy of proof
   rather than a uniform grid of logos.

   Every card carries the .motion-tile class so the page's existing grid
   choreography staggers them in, no new animation code.

   Outcome lines follow the agency's own credibility rule: scaling is
   described as multi crore, never as an exact revenue figure, because an
   exact figure without documentation costs more trust than it buys.
   ────────────────────────────────────────────────────────────────────────── */

function Card({
  c,
  featured = false,
}: {
  c: (typeof CLIENT_CASES)[number];
  featured?: boolean;
}) {
    const Icon = c.icon;
    return (
      <article
        className="surface motion-tile p-5 sm:p-6 flex flex-col text-left h-full"
        style={{
          // The card's own tone is a rule along the top, the way a printed
          // section marks itself. The rest of the box stays hairline, so
          // five of these side by side read as a set rather than a paint box.
          borderTop: `2px solid ${c.tone}`,
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <span
            className="flex items-center justify-center w-9 h-9 shrink-0"
            style={{ border: "1px solid var(--rule)", color: c.tone }}
          >
            <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
          </span>
          <div className="min-w-0">
            <h3
              className="font-disp leading-tight truncate"
              style={{ fontSize: featured ? "clamp(19px, 2.4vw, 26px)" : "18px", fontWeight: 700, color: "var(--ink)" }}
            >
              {c.client}
            </h3>
            <p className="font-tech text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color: "var(--muted)" }}>
              {c.sector}
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--body)" }}>
          {c.brief}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {c.services.map((s) => (
            <span
              key={s}
              className="px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
              style={{
                background: "var(--paper-2)",
                border: "1px solid var(--rule)",
                color: "var(--ink)",
              }}
            >
              {s}
            </span>
          ))}
        </div>

        <ul className="mt-auto flex flex-col gap-2">
          {c.outcomes.map((o) => (
            <li key={o} className="flex gap-2.5 text-sm leading-snug" style={{ color: "var(--ink)" }}>
              <span
                className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: c.tone }}
              />
              <span className="font-medium">{o}</span>
            </li>
          ))}
        </ul>
      </article>
    );
  }

export function ClientImpact() {
  const [lead, second, ...rest] = CLIENT_CASES;
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card c={lead} featured />
        <Card c={second} featured />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rest.map((c) => (
          <Card key={c.id} c={c} />
        ))}
      </div>
    </div>
  );
}
