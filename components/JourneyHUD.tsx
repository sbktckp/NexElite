"use client";

import { useEffect, useRef, useState } from "react";
import { SERVICES } from "@/lib/services";
import { corridorState, gateFraction } from "@/components/SignalCorridor";
import { onFrame } from "@/lib/frame";
import { scrollFraction, scrollToFraction } from "@/lib/scroll";

/**
 * JourneyHUD
 *
 * The progress bar and the 3D journey are the same instrument. The corridor
 * writes its live state every frame and this renders the readable half of it,
 * so the ring igniting in 3D, the rail segment brightening and the caption
 * changing all fire as one event.
 *
 * ── Why this reads smooth now ─────────────────────────────────────────────
 * It used to run its own requestAnimationFrame loop, which is the exact
 * two clock problem lib/frame.ts exists to prevent: the HUD sampled state
 * from a frame the corridor had not written yet, so the glow lagged the
 * ring by a frame under load.
 *
 * It also pushed every continuous value through React state at 12fps, so
 * the rail glow and the segment fills stepped in visible 80ms increments
 * instead of gliding.
 *
 * Split by rate of change. Continuous values, progress and ignition, are
 * written to CSS custom properties on the container every frame and consumed
 * by calc() in the styles below, so they move at display rate and cost no
 * renders at all. Discrete values, which gate you are at and the rounded
 * percentage, still use state but only set when they actually change.
 *
 * Under reduced motion or when WebGL is unavailable the corridor never
 * boots, so corridorState stays frozen at zero. The fallback below reads
 * document scroll directly in that case, which is why the rail still works
 * with the journey switched off.
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

      let progress: number;
      let ignite: number;
      let lock: number;
      let nextGate: number;

      if (corridorState.live) {
        progress = corridorState.progress;
        ignite = corridorState.ignite;
        lock = corridorState.resolve;
        nextGate = corridorState.gate;
      } else {
        // No journey rendering. Derive everything from the page itself so
        // the rail is still an honest progress indicator.
        progress = scrollFraction();
        lock = progress;
        const scaled = progress * N;
        nextGate = Math.min(N - 1, Math.floor(scaled));
        // Peaks at the centre of each segment, so the active pip still
        // breathes as you pass through it.
        ignite = 1 - Math.abs((scaled % 1) - 0.5) * 2;
      }

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
      const nextPct = Math.round(lock * 100);
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
        className="rounded-2xl px-4 py-2.5"
        style={{
          background: "rgba(9,18,28,0.72)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(126,200,227,0.28)",
          boxShadow:
            "0 0 0 1px rgba(126,200,227,calc(0.1 + var(--ig) * 0.22))," +
            " 0 12px 34px -14px rgba(47,93,124,0.5)," +
            ` 0 0 calc(14px + var(--ig) * 26px) -12px ${svc.tone}`,
        }}
      >
        {/* Resting state is two rows: a label line and the rail. Everything
            else that used to sit here, the tagline, the description slot and
            a separate status row, made the panel tall enough to cover the
            hero CTAs on a short viewport. The detail now lives in the hover
            drawer below, which grows upward from a bottom anchored element
            so nothing above it shifts. */}
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <span
            className="text-[12px] sm:text-[13px] font-semibold truncate"
            style={{ color: "#EAF6FF" }}
          >
            {svc.name}
          </span>
          <span
            className="font-tech text-[10px] sm:text-[11px] shrink-0 tabular-nums tracking-wider"
            style={{ color: "rgba(234,246,255,0.5)" }}
          >
            {String(gate + 1).padStart(2, "0")}/{String(N).padStart(2, "0")}
            <span style={{ color: "rgba(234,246,255,0.28)" }}> · </span>
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
                onClick={() => scrollToFraction(Math.min(0.995, gateFraction(i, N)))}
                title={s.name}
                aria-label={`Go to ${s.name}`}
                aria-current={active ? "step" : undefined}
                className="relative flex-1 rounded-full overflow-hidden hover:scale-y-[2] focus-visible:outline-2 focus-visible:outline-offset-4"
                style={{
                  background: "rgba(126,200,227,0.16)",
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
            style={{ color: "rgba(234,246,255,0.68)" }}
          >
            {svc.description}
          </p>
        </div>
      </div>
    </div>
  );
}
