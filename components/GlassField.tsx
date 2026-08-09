"use client";

/* ──────────────────────────────────────────────────────────────────────────
   GlassField

   The backdrop the whole site refracts. Replaces SignalCorridor.

   Glass only reads as glass when there is something behind it worth
   blurring. A flat white page under a frosted panel gives flat white
   frost, which is why so many glass themes look like grey rectangles.
   So this lays down a slow field of coloured light: five soft lobes in
   the brand palette, drifting, plus a fine grid and a grain tile that
   give the blur edges to smear.

   Everything here is composited. A handful of elements, transform and
   opacity only, no canvas, no WebGL, no per-pixel work on the main
   thread. The whole file costs less than the corridor's import statement
   did.

   Motion is driven from the shared frame bus so it stays on the same
   clock as Lenis, and it parks entirely under reduced motion, where the
   lobes still render but hold still.
   ────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import { onFrame } from "@/lib/frame";
import { scrollFraction } from "@/lib/scroll";
import { useReducedMotion } from "@/lib/useReducedMotion";

type Lobe = {
  /** Resting position, in viewport units. */
  x: number;
  y: number;
  /** Diameter, in viewport width units. */
  size: number;
  color: string;
  /** How far the lobe travels across the full scroll, in viewport units. */
  driftX: number;
  driftY: number;
  /** Seconds per full breathing cycle, and its phase offset. */
  period: number;
  phase: number;
};

/*
  Deliberately saturated. These sit behind panes that blur at 34 to 52px and
  push saturation to 220%, and a blur that heavy eats most of the colour
  before it reaches the viewer. Lobes tuned to look right on their own are
  invisible through the glass; these look slightly too strong with the
  panes hidden, which is the correct amount once they are back.
*/
const LOBES: Lobe[] = [
  { x: 16, y: 20, size: 68, color: "rgba(126,200,227,0.9)", driftX: 14, driftY: 26, period: 19, phase: 0 },
  { x: 80, y: 32, size: 58, color: "rgba(217,185,138,0.72)", driftX: -18, driftY: 18, period: 23, phase: 1.7 },
  { x: 40, y: 72, size: 76, color: "rgba(47,93,124,0.45)", driftX: 10, driftY: -30, period: 27, phase: 3.1 },
  { x: 90, y: 84, size: 50, color: "rgba(150,190,222,0.78)", driftX: -12, driftY: -20, period: 17, phase: 4.4 },
  { x: 58, y: 46, size: 40, color: "rgba(255,232,196,0.6)", driftX: -8, driftY: 22, period: 31, phase: 2.2 },
];

export function GlassField() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const lobeRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (reduced) return;

    /*
      Scroll is smoothed here rather than read raw. Lenis already eases the
      page, but the lobes travel much further per unit of scroll than the
      copy does, so any residual step in the scroll value is magnified into
      a visible jump. A single pole filter on the value costs one multiply
      and removes it.
    */
    let smoothed = scrollFraction();

    return onFrame((time) => {
      const target = scrollFraction();
      smoothed += (target - smoothed) * 0.06;

      const t = time / 1000;

      for (let i = 0; i < LOBES.length; i++) {
        const el = lobeRefs.current[i];
        if (!el) continue;
        const lobe = LOBES[i];

        // Scroll parallax plus a slow independent breath, so the field
        // never sits still even when the page does.
        const breathX = Math.sin(t * ((Math.PI * 2) / lobe.period) + lobe.phase) * 3.5;
        const breathY = Math.cos(t * ((Math.PI * 2) / lobe.period) * 0.8 + lobe.phase) * 3;

        const dx = smoothed * lobe.driftX + breathX;
        const dy = smoothed * lobe.driftY + breathY;

        el.style.transform = `translate3d(${dx}vw, ${dy}vh, 0)`;
      }

      // The whole field cools slightly as you descend, so the bottom of
      // the page is calmer than the hero without a second gradient layer.
      const root = rootRef.current;
      if (root) root.style.opacity = (1 - smoothed * 0.3).toFixed(3);
    });
  }, [reduced]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Base wash. Keeps the page from ever going pure white behind the
          glass, which is what makes a frosted panel disappear. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, #ffffff 0%, #eef7fc 40%, #e4f0f8 100%)",
        }}
      />

      {LOBES.map((lobe, i) => (
        <div
          key={i}
          ref={(el) => {
            lobeRefs.current[i] = el;
          }}
          className="absolute rounded-full"
          style={{
            left: `${lobe.x}vw`,
            top: `${lobe.y}vh`,
            width: `${lobe.size}vw`,
            height: `${lobe.size}vw`,
            marginLeft: `-${lobe.size / 2}vw`,
            marginTop: `-${lobe.size / 2}vw`,
            background: `radial-gradient(circle at 50% 50%, ${lobe.color} 0%, transparent 68%)`,
            filter: "blur(70px)",
            willChange: "transform",
          }}
        />
      ))}

      {/* Fine armature. The grid is what the blur has to chew on, so panels
          read as refracting something structured rather than fogging a
          gradient. Masked to fade at the edges so it never draws a frame
          around the viewport. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(47,93,124,0.085) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(47,93,124,0.085) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 80% 65% at 50% 45%, #000 30%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 65% at 50% 45%, #000 30%, transparent 100%)",
        }}
      />

      {/* Grain. Real glass is never optically perfect, and a blurred
          gradient is. One static SVG turbulence tile at very low opacity
          gives the blur something irregular to carry, which is the
          difference between frosted and merely faded. Inlined so it costs
          no request, and it never animates. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")",
          opacity: 0.16,
          mixBlendMode: "overlay",
        }}
      />

      {/* Directional light. app/page.tsx writes --scrim-shift as stages come
          into view, so the brightest part of the field slides away from
          whichever side the copy currently occupies. Same variable the old
          corridor scrim used, doing an honest job now: it lights the glass
          instead of veiling a 3D scene. */}
      <div
        className="scrim absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 70% at 50% 40%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.14) 55%, transparent 100%)",
        }}
      />
    </div>
  );
}
