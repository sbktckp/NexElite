"use client";

import { useEffect, useRef, useState } from "react";
import { SERVICES } from "@/lib/services";

/**
 * SignalRings — the new signature visual.
 * Concentric SVG rings with a rotating sweep, one ring-arc per service.
 * Deliberately NOT a particle system: real vector paths, real DOM nodes,
 * so it can be described to assistive tech and works with zero JS motion.
 */
export function SignalRings({ activeIndex = -1 }: { activeIndex?: number }) {
  const sweepRef = useRef<SVGGElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

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
        <defs>
          <radialGradient id="ringGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7EC8E3" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#7EC8E3" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={cx} cy={cy} r={baseR + ringGap * (N - 1) + 30} fill="url(#ringGlow)" />

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
              stroke={isActive ? s.tone : "rgba(47,93,124,0.16)"}
              strokeWidth={isActive ? 2.5 : 1.2}
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
              stroke="#7EC8E3"
              strokeWidth="2"
              opacity="0.55"
            />
          </g>
        )}

        <circle cx={cx} cy={cy} r={10} fill="#2F5D7C" />
        <circle cx={cx} cy={cy} r={4} fill="#7EC8E3" />

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
              stroke="#ffffff"
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
