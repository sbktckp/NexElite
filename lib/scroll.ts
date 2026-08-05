/* ──────────────────────────────────────────────────────────────────────────
   One scroller.

   Lenis intercepts wheel and touch and animates scrollTop itself. Anything
   that calls window.scrollTo with behavior "smooth" starts a second, native
   animation on the same property. The two fight for a few hundred
   milliseconds and the result reads as a stutter, which is exactly what
   clicking a rail segment in the HUD used to feel like.

   So the instance is registered here on mount and every programmatic scroll
   in the app goes through scrollToFraction. If Lenis is absent, reduced
   motion or a hydration gap, it falls back to an instant native jump rather
   than a competing smooth one.
   ────────────────────────────────────────────────────────────────────────── */

type Scroller = {
  scrollTo: (
    target: number,
    options?: { duration?: number; immediate?: boolean }
  ) => void;
};

let active: Scroller | null = null;

export function registerScroller(s: Scroller | null) {
  active = s;
  return () => {
    if (active === s) active = null;
  };
}

/** Maximum scrollable distance in pixels. */
export function scrollRange(): number {
  const doc = document.scrollingElement || document.documentElement;
  return Math.max(0, doc.scrollHeight - doc.clientHeight);
}

/** Current scroll position as a 0 to 1 fraction of the range. */
export function scrollFraction(): number {
  const doc = document.scrollingElement || document.documentElement;
  const max = scrollRange();
  if (max <= 0) return 0;
  return Math.max(0, Math.min(1, doc.scrollTop / max));
}

/**
 * Scroll to a fraction of the page. Duration scales with distance so a jump
 * to the neighbouring gate is quick and a jump across the whole journey
 * still reads as travel rather than a teleport.
 */
export function scrollToFraction(frac: number) {
  const max = scrollRange();
  const top = Math.max(0, Math.min(1, frac)) * max;

  if (!active) {
    window.scrollTo({ top, behavior: "auto" });
    return;
  }

  const distance = Math.abs(top - (document.scrollingElement?.scrollTop ?? 0));
  const duration = Math.min(1.8, 0.5 + (distance / Math.max(1, max)) * 1.6);
  active.scrollTo(top, { duration });
}
