/* ──────────────────────────────────────────────────────────────────────────
   Gate positions along the page.

   This used to live in SignalCorridor, because the gates were points on a
   3D spline. With the corridor gone the gates are simply evenly spaced
   stops down the document, and the HUD is the only thing that needs them.
   Kept in lib so no component owns state another component reads.
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Fraction of the page to scroll to for gate `index` of `total`.
 *
 * Half a segment of lead-in, so a gate lands with its section centred
 * rather than with the section header pinned to the top edge.
 */
export function gateFraction(index: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(0.995, (index + 0.5) / total);
}
