"use client";

import { CLIENT_CASES, CREATOR_GROWTH } from "@/lib/impact";

/* ──────────────────────────────────────────────────────────────────────────
   BrandMarquee.

   Two counter scrolling strips between the hero and the channels beat. Not
   decoration: every token in it is a real client, sector, or logged result,
   so the strip is the proof section compressed to a glance. The top row
   carries who, the bottom row carries what happened, and they move against
   each other so the eye keeps catching new pairings.

   Built as pure CSS animation on a duplicated track (the standard seamless
   loop: the track holds the sequence twice and translates by exactly half
   its own width). Duplicates are aria-hidden so screen readers hear the
   list once. Pauses on hover so tokens can actually be read, and
   prefers-reduced-motion stops it entirely via the global rule, leaving a
   static, still legible strip.
   ────────────────────────────────────────────────────────────────────────── */

const WHO = [
  ...CLIENT_CASES.map((c) => ({ a: c.client, b: c.sector })),
  { a: "Creator roster", b: "Doctors and lifestyle" },
];

const WHAT = [
  ...CREATOR_GROWTH.map((c) => ({
    a: `${(c.to / 1000) % 1 === 0 ? c.to / 1000 : (c.to / 1000).toFixed(1)}k followers`,
    b: `from ${c.from >= 1000 ? `${c.from / 1000}k` : c.from} in ${c.window}`,
  })),
  { a: "40M+ views", b: "delivered" },
  { a: "60+ brands", b: "launched" },
  { a: "48hr", b: "average turnaround" },
];

function Token({ a, b }: { a: string; b: string }) {
  return (
    <span className="inline-flex items-baseline gap-2 shrink-0">
      <span className="font-disp text-sm sm:text-base font-extrabold whitespace-nowrap" style={{ color: "#2F5D7C" }}>
        {a}
      </span>
      <span className="font-tech text-[10px] sm:text-[11px] uppercase tracking-[0.16em] font-bold whitespace-nowrap" style={{ color: "#8aa3b5" }}>
        {b}
      </span>
      <span className="mx-4 sm:mx-6 w-1 h-1 rounded-full self-center shrink-0" style={{ background: "#7EC8E3" }} />
    </span>
  );
}

function Track({ items, reverse }: { items: { a: string; b: string }[]; reverse?: boolean }) {
  return (
    <div className="marquee overflow-hidden">
      <div className={`marquee-track ${reverse ? "marquee-reverse" : ""} flex items-center w-max`}>
        <div className="flex items-center shrink-0 pr-0">
          {items.map((t) => (
            <Token key={t.a} {...t} />
          ))}
        </div>
        <div className="flex items-center shrink-0 pr-0" aria-hidden="true">
          {items.map((t) => (
            <Token key={`${t.a}-dup`} {...t} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function BrandMarquee() {
  return (
    <section
      aria-label="Clients and logged results"
      className="glass relative py-5 sm:py-6 flex flex-col gap-3"
      style={{
        zIndex: 2,
        // Full width band, so the pane has edges only top and bottom.
        border: "none",
        borderTop: "1px solid rgba(255,255,255,0.7)",
        borderBottom: "1px solid rgba(47,93,124,0.1)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
        // Fades both ends so tokens dissolve at the edges instead of
        // getting guillotined by the container.
        maskImage:
          "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
    >
      <Track items={WHO} />
      <Track items={WHAT} reverse />
    </section>
  );
}
