"use client";

import { useEffect, useRef, useState } from "react";
import { SERVICES } from "@/lib/services";
import { gateFraction } from "@/lib/journey";
import { onFrame } from "@/lib/frame";
import { scrollFraction, scrollToFraction } from "@/lib/scroll";

/**
 * JourneyHUD
 *
 * The rail at the bottom: where you are on the page, which channel that
 * puts you in front of, and a way to jump between them.
 *
 * It used to read live state written by the Three.js corridor every frame.
 * With the corridor gone, document scroll is the only clock, which is
 * simpler and honest: the rail now measures the thing the visitor is
 * actually moving.
 *
 * ── Why this reads smooth ──────────────────────────────────────────────
 * Split by rate of change. Continuous values, progress and ignition, are
 * written to CSS custom properties on the container every frame and consumed
 * by calc() in the styles below, so they move at display rate and cost no
 * renders at all. Discrete values, which gate you are at and the rounded
 * percentage, still use state but only set when they actually change.
 *
 * It subscribes to the shared frame bus rather than running its own rAF, so
 * it samples scroll in the same frame Lenis settles it.
 */

const SAMPLE_MS = 80;

export function JourneyHUD() {
  const N = SERVICES.length;
  const rootRef = useRef<HTMLDivElement>(null);
  const [gate, setGate] = useState(0);
  const [pct, setPct] = useState(0);

  // Mirrors of the state above, so the frame loop can compare without
  // closing over stale values or re-subscribing on every change.
  const gateRef = useRef(0);
  const pctRef = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => {
    return onFrame((now) => {
      const root = rootRef.current;
      if (!root) return;

      const progress = scrollFraction();
      const scaled = progress * N;
      const nextGate = Math.min(N - 1, Math.floor(scaled));

      // Peaks at the centre of each segment, so the active pip breathes as
      // you pass through it rather than snapping at the boundary.
      const ignite = 1 - Math.abs((scaled % 1) - 0.5) * 2;

      // Continuous, every frame, zero renders.
      root.style.setProperty("--p", progress.toFixed(4));
      root.style.setProperty("--ig", ignite.toFixed(3));

      // Discrete, throttled, and only when the value actually moved.
      if (now - lastRef.current < SAMPLE_MS) return;
      lastRef.current = now;

      if (nextGate !== gateRef.current) {
        gateRef.current = nextGate;
        setGate(nextGate);
      }
      const nextPct = Math.round(progress * 100);
      if (nextPct !== pctRef.current) {
        pctRef.current = nextPct;
        setPct(nextPct);
      }
    });
  }, [N]);

  const svc = SERVICES[gate];

  return (
    <div
      ref={rootRef}
      className="journey-hud fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(92vw,520px)]"
      style={{ ["--p" as string]: "0", ["--ig" as string]: "0" }}
    >
      <div
        className="glass-thick glass-edge rounded-2xl px-4 py-2.5"
        style={{
          // The service tone bleeds through the pane as you cross into it.
          // Everything else about the panel is fixed, so this is the only
          // thing that reads as movement when a gate changes.
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.95)," +
            " 0 18px 48px -24px rgba(47,93,124,0.45)," +
            ` 0 0 calc(16px + var(--ig) * 28px) -14px ${svc.tone}`,
        }}
      >
        {/* Resting state is two rows: a label line and the rail. The detail
            lives in the hover drawer below, which grows upward from a bottom
            anchored element so nothing above it shifts. */}
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <span
            className="text-[12px] sm:text-[13px] font-semibold truncate"
            style={{ color: "#2F5D7C" }}
          >
            {svc.name}
          </span>
          <span
            className="font-tech text-[10px] sm:text-[11px] shrink-0 tabular-nums tracking-wider"
            style={{ color: "rgba(47,93,124,0.55)" }}
          >
            {String(gate + 1).padStart(2, "0")}/{String(N).padStart(2, "0")}
            <span style={{ color: "rgba(47,93,124,0.32)" }}> · </span>
            {pct}%
          </span>
        </div>

        <div
          className="flex gap-1 h-1.5"
          role="group"
          aria-label="Jump to a service"
        >
          {SERVICES.map((s, i) => {
            const active = i === gate;
            return (
              <button
                key={s.id}
                onClick={() => scrollToFraction(gateFraction(i, N))}
                title={s.name}
                aria-label={`Go to ${s.name}`}
                aria-current={active ? "step" : undefined}
                className="relative flex-1 rounded-full overflow-hidden hover:scale-y-[2] focus-visible:outline-2 focus-visible:outline-offset-4"
                style={{
                  background: "rgba(47,93,124,0.14)",
                  outlineColor: s.tone,
                  transition: "transform 200ms ease",
                  // Continuous, so the active pip tracks ignition at display
                  // rate rather than stepping every 80ms.
                  ...(active
                    ? {
                        transform: "scaleY(calc(1 + var(--ig) * 0.9))",
                        boxShadow: `0 0 calc(4px + var(--ig) * 10px) ${s.tone}`,
                      }
                    : null),
                }}
              >
                <div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `clamp(0%, calc(var(--p) * ${N * 100}% - ${i * 100}%), 100%)`,
                    background: `linear-gradient(90deg, ${s.tone}, #D9B98A)`,
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Collapsed to zero height until hover. grid-template-rows animates
            between 0fr and 1fr, so the drawer opens without hard coding a
            height that would break on a long description. */}
        <div className="hud-drawer">
          <p
            className="text-[12px] leading-snug"
            style={{ color: "rgba(47,93,124,0.75)" }}
          >
            {svc.description}
          </p>
        </div>
      </div>
    </div>
  );
}
