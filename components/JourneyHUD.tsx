"use client";

import { useEffect, useRef, useState } from "react";
import { SERVICES } from "@/lib/services";
import { gateFraction } from "@/lib/journey";
import { onFrame } from "@/lib/frame";
import { scrollFraction, scrollToFraction } from "@/lib/scroll";

/**
 * JourneyHUD
 *
 * The reading position, set as the masthead's own bottom rule.
 *
 * It used to be a floating card at the bottom of the viewport, which meant
 * the page carried two persistent chrome elements at opposite edges and the
 * rule under the masthead was doing nothing. Now they are one object: the
 * hairline that closes the masthead IS the progress bar, filling with ink
 * as you read and ticked into eight segments, one per channel. Nothing
 * floats and nothing is added to the layout, which is why it reads as part
 * of the page rather than as an overlay on it.
 *
 * Rendered inside <header> in app/page.tsx. It positions itself against
 * that header, so it must not be mounted anywhere else.
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

      // Peaks at the centre of each segment, so the active tick thickens as
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
      className="journey-hud absolute inset-x-0 bottom-0"
      style={{ ["--p" as string]: "0", ["--ig" as string]: "0" }}
    >
      {/*
        The rule itself. Two layers: the full-width hairline that the
        masthead needs anyway, and the ink fill scaled across it. Scaling a
        single element beats animating eight widths, and transform is the
        one property that never costs layout.
      */}
      <div className="relative h-px w-full" style={{ background: "var(--rule)" }}>
        <div
          className="absolute inset-y-0 left-0 w-full origin-left"
          style={{
            background: "var(--ink)",
            transform: "scaleX(var(--p))",
          }}
        />

        {/*
          Channel ticks, sitting on the rule. Each is a click target the
          full height of the header strip below it, so they are reachable
          without being visible chrome: the visible part is a 1px mark.
        */}
        <div className="absolute inset-x-0 -top-2 flex h-4">
          {SERVICES.map((s, i) => {
            const active = i === gate;
            return (
              <button
                key={s.id}
                onClick={() => scrollToFraction(gateFraction(i, N))}
                title={s.name}
                aria-label={`Go to ${s.name}`}
                aria-current={active ? "step" : undefined}
                className="relative flex-1 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {/* The mark. Hidden on the first tick, which would otherwise
                    print a stray rule against the left margin. */}
                {i > 0 && (
                  <span
                    className="absolute left-0 bottom-0 w-px"
                    style={{
                      // Passed segments mark in ink, ahead of you in rule.
                      background: i <= gate ? "var(--ink)" : "var(--rule-strong)",
                      // The tick you are inside grows as you cross it.
                      height: active ? "calc(5px + var(--ig) * 5px)" : "4px",
                    }}
                  />
                )}
                {active && (
                  <span
                    className="absolute bottom-0 left-0 right-0"
                    style={{
                      height: "2px",
                      background: s.tone,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/*
        Running head. Set like the folio line of a magazine: section name on
        the left, position on the right, hairline rule above. Collapsed to
        nothing until you hover the masthead, so at rest the page shows only
        the filled rule and the reader is never told what they can already
        see.
      */}
      <div
        className="hud-drawer"
        style={{ background: "var(--paper)", borderBottom: "1px solid var(--rule)" }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-6 flex items-baseline justify-between gap-6 pb-2">
          <p className="text-[12px] sm:text-[13px] leading-snug" style={{ color: "var(--body)" }}>
            <span className="font-semibold" style={{ color: "var(--ink)" }}>
              {svc.name}.
            </span>{" "}
            <span className="hidden sm:inline">{svc.description}</span>
          </p>
          <p
            className="font-tech text-[10px] sm:text-[11px] shrink-0 tabular-nums tracking-[0.16em]"
            style={{ color: "var(--muted)" }}
          >
            {String(gate + 1).padStart(2, "0")}/{String(N).padStart(2, "0")}
            <span style={{ color: "var(--rule-strong)" }}> · </span>
            {pct}%
          </p>
        </div>
      </div>
    </div>
  );
}
