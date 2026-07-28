/* ──────────────────────────────────────────────────────────────────────────
   Motion grammar.

   Coherence is felt through repetition. Every reveal on the site uses these
   values and nothing else. If a section needs a different curve, the section
   is wrong, not the curve.

   Only transform and opacity are ever animated. Anything that triggers
   layout is a bug, not a style choice.
   ────────────────────────────────────────────────────────────────────────── */

export const DURATION = {
  /** Micro feedback: hovers, button presses, chip states. */
  quick: 0.12,
  /** Standard: most reveals, panel opens, card entrances. */
  base: 0.24,
  /** Deliberate: full stage entrances, route transitions. */
  slow: 0.48,
} as const;

export const EASE = {
  /** Everything entering the viewport. */
  out: "power3.out",
  /** Anything leaving. */
  in: "power2.in",
  /** Cards and tiles that should feel physical. Used sparingly. */
  settle: "back.out(1.4)",
} as const;

/** Vertical travel for the standard reveal, in pixels. */
export const RISE = 24;

/** Delay between siblings in any staggered group, in seconds. */
export const STAGGER = 0.06;

/** Shared ScrollTrigger window so every stage resolves at the same point. */
export const REVEAL_TRIGGER = {
  start: "top 80%",
  end: "top 42%",
  scrub: true,
} as const;
