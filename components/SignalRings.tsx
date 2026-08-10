"use client";

import { useRef } from "react";
import { SERVICES } from "@/lib/services";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * SignalRings.
 * Concentric SVG rings with a rotating sweep, one ring-arc per service.
 * Deliberately NOT a particle system: real vector paths, real DOM nodes,
 * so it can be described to assistive tech and works with zero JS motion.
 */
export function SignalRings({ activeIndex = -1 }: { activeIndex?: number }) {
  const sweepRef = useRef<SVGGElement>(null);
  const reduced = useReducedMotion();

  const N = SERVICES.length;
  const size = 480;
  const cx = size / 2;
  const cy = size / 2;
  const baseR = 60;
  const ringGap = 22;

  return (
    <div className="relative w-full flex items-center justify-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width="100%"
        style={{ maxWidth: 480 }}
        role="img"
        aria-label={`Signal instrument showing ${N} service channels. Currently focused: ${
          activeIndex >= 0 ? SERVICES[activeIndex].name : "none"
        }.`}
      >
        {SERVICES.map((s, i) => {
          const r = baseR + i * ringGap;
          const isActive = i === activeIndex;
          return (
            <circle
              key={s.id}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={isActive ? s.tone : "var(--rule)"}
              strokeWidth={isActive ? 2 : 1}
              style={{ transition: "stroke 0.4s ease, stroke-width 0.4s ease" }}
            />
          );
        })}

        {!reduced && (
          <g
            ref={sweepRef}
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              animation: "signal-sweep 6s linear infinite",
            }}
          >
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - (baseR + ringGap * (N - 1) + 20)}
              stroke="var(--accent)"
              strokeWidth="1.5"
              opacity="0.5"
            />
          </g>
        )}

        <circle cx={cx} cy={cy} r={9} fill="var(--ink)" />
        <circle cx={cx} cy={cy} r={3.5} fill="var(--paper)" />

        {SERVICES.map((s, i) => {
          const r = baseR + i * ringGap;
          const isActive = i === activeIndex;
          if (!isActive) return null;
          const angle = -Math.PI / 2 + (i / N) * Math.PI * 0.6;
          const dotX = cx + r * Math.cos(angle);
          const dotY = cy + r * Math.sin(angle);
          return (
            <circle
              key={`dot-${s.id}`}
              cx={dotX}
              cy={dotY}
              r={5}
              fill={s.tone}
              stroke="var(--paper)"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>

      <style jsx>{`
        @keyframes signal-sweep {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
