"use client";

import { useEffect, useRef, useState } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   CutCadence.

   The rhythm stage claims cuts land on the beat and that every cut earns the
   next three seconds. This draws that claim instead of restating it.

   A timeline of edit points: attention decays between cuts and a well placed
   cut resets it. The teeth are what the claim looks like as a shape. The
   comparison line underneath is the same clip cut lazily, where attention
   just slides off.

   Deliberately unnumbered. This is a diagram of a method, not a measurement,
   and putting axis values on it would imply data that does not exist. The
   caption says so plainly.

   The path draws itself once on entry using stroke-dashoffset, which is the
   cheapest possible reveal: one property, GPU friendly, and it degrades to
   a static path when reduced motion zeroes the transition.
   ────────────────────────────────────────────────────────────────────────── */

const W = 520;
const H = 260;
const BASE = 210;
const TOP = 46;

/** Cut points across the timeline, in x. Uneven on purpose: a metronome is
    not a rhythm. */
const CUTS = [70, 140, 196, 268, 322, 396, 452];

/** Attention sawtooth: each cut snaps back to full, then decays until the
    next one. */
function tunedPath(): string {
  let d = `M 24 ${BASE}`;
  d += ` L 24 ${TOP}`;
  let prev = 24;
  for (const x of CUTS) {
    // Decay toward the cut, then the vertical reset at the cut itself.
    const decayTo = TOP + (x - prev) * 0.42;
    d += ` L ${x} ${Math.min(BASE - 18, decayTo)}`;
    d += ` L ${x} ${TOP}`;
    prev = x;
  }
  d += ` L ${W - 24} ${Math.min(BASE - 18, TOP + (W - 24 - prev) * 0.42)}`;
  return d;
}

/** The same clip without the discipline: one long slide. */
const LAZY = `M 24 ${TOP + 26} C 160 ${TOP + 60}, 300 ${BASE - 40}, ${W - 24} ${BASE - 6}`;

export function CutCadence() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setActive(true);
          obs.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="glass glass-edge lift rounded-2xl p-5 sm:p-6 w-full"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Diagram comparing attention across a rhythmically cut edit, which resets at each cut, against a lazily cut edit, which decays continuously."
      >
        <defs>
          <linearGradient id="cadenceStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2F5D7C" />
            <stop offset="70%" stopColor="#7EC8E3" />
            <stop offset="100%" stopColor="#D9B98A" />
          </linearGradient>
        </defs>

        {/* Baseline and ceiling, the only structure the diagram needs. */}
        <line x1="24" y1={BASE} x2={W - 24} y2={BASE} stroke="rgba(47,93,124,0.18)" strokeWidth="1" />
        <line
          x1="24"
          y1={TOP}
          x2={W - 24}
          y2={TOP}
          stroke="rgba(47,93,124,0.12)"
          strokeWidth="1"
          strokeDasharray="3 5"
        />

        {/* Cut markers. */}
        {CUTS.map((x, i) => (
          <g key={x}>
            <line
              x1={x}
              y1={TOP - 6}
              x2={x}
              y2={BASE}
              stroke="rgba(126,200,227,0.45)"
              strokeWidth="1"
              style={{
                opacity: active ? 1 : 0,
                transition: `opacity 400ms ease ${600 + i * 90}ms`,
              }}
            />
            <circle
              cx={x}
              cy={TOP - 6}
              r="2.5"
              fill="#7EC8E3"
              style={{
                opacity: active ? 1 : 0,
                transition: `opacity 400ms ease ${600 + i * 90}ms`,
              }}
            />
          </g>
        ))}

        {/* The lazy cut, drawn first so it sits behind. */}
        <path
          d={LAZY}
          fill="none"
          stroke="rgba(47,93,124,0.22)"
          strokeWidth="2"
          strokeDasharray="4 6"
        />

        {/* The method. */}
        <path
          d={tunedPath()}
          fill="none"
          stroke="url(#cadenceStroke)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{
            strokeDasharray: 1600,
            strokeDashoffset: active ? 0 : 1600,
            transition: "stroke-dashoffset 1800ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />

        <text x="24" y={TOP - 18} className="font-tech" fontSize="10" fill="#8aa3b5" letterSpacing="1.6">
          ATTENTION HELD
        </text>
        <text x="24" y={BASE + 22} className="font-tech" fontSize="10" fill="#8aa3b5" letterSpacing="1.6">
          CUT
        </text>
        <text x={W - 24} y={BASE + 22} textAnchor="end" className="font-tech" fontSize="10" fill="#8aa3b5" letterSpacing="1.6">
          CUT
        </text>
      </svg>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
        <span className="flex items-center gap-2 text-xs" style={{ color: "#2F5D7C" }}>
          <span className="w-5 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg, #2F5D7C, #7EC8E3)" }} />
          <span className="font-semibold">Cut on the beat</span>
        </span>
        <span className="flex items-center gap-2 text-xs" style={{ color: "#8aa3b5" }}>
          <span
            className="w-5 h-0.5 rounded-full"
            style={{ background: "repeating-linear-gradient(90deg, rgba(47,93,124,0.35) 0 3px, transparent 3px 6px)" }}
          />
          <span>Left running</span>
        </span>
      </div>
      <p className="text-[11px] leading-relaxed mt-2" style={{ color: "#8aa3b5" }}>
        Illustrative. A diagram of how we edit, not a measurement.
      </p>
    </div>
  );
}
