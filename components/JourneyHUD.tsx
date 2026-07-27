"use client";

import { useEffect, useRef, useState } from "react";
import { SERVICES } from "@/lib/services";
import { corridorState, gateFraction } from "@/components/SignalCorridor";

/**
 * JourneyHUD
 *
 * The progress bar and the 3D journey are the same instrument here.
 * The corridor writes its live state every frame; this samples that state
 * on a throttled loop and renders the readable half of it.
 *
 * Three things stay locked together: the ring igniting in 3D, the rail
 * segment brightening, and the caption changing. They share one clock, so
 * passing a gate reads as a single event rather than three components
 * reacting separately.
 *
 * Sampling runs at roughly 12fps via requestAnimationFrame with a time
 * gate. Reading corridorState 60 times a second into React state would
 * re-render the page on every frame for no visible gain.
 */

const SAMPLE_MS = 80;

export function JourneyHUD() {
  const N = SERVICES.length;
  const [gate, setGate] = useState(0);
  const [ignite, setIgnite] = useState(0);
  const [progress, setProgress] = useState(0);
  const [lock, setLock] = useState(0);
  const [open, setOpen] = useState(false);
  const rafRef = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => {
    function loop(now: number) {
      rafRef.current = requestAnimationFrame(loop);
      if (now - lastRef.current < SAMPLE_MS) return;
      lastRef.current = now;
      setGate(corridorState.gate);
      setIgnite(corridorState.ignite);
      setProgress(corridorState.progress);
      setLock(corridorState.resolve);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  function jumpTo(i: number) {
    const doc = document.scrollingElement || document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const frac = Math.min(0.995, gateFraction(i, N));
    window.scrollTo({ top: frac * max, behavior: "smooth" });
  }

  const svc = SERVICES[gate];
  const pct = Math.round(lock * 100);

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(94vw,760px)]"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div
        className="rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 transition-shadow duration-300"
        style={{
          background: "rgba(9,18,28,0.74)",
          backdropFilter: "blur(18px)",
          border: "1px solid rgba(126,200,227,0.32)",
          boxShadow: `0 0 0 1px rgba(126,200,227,${0.12 + ignite * 0.3}), 0 18px 50px -14px rgba(47,93,124,0.55), 0 0 ${20 + ignite * 40}px -10px ${svc.tone}`,
        }}
      >
        <div className="flex items-baseline justify-between gap-3 mb-1.5">
          <span
            className="text-[13px] sm:text-sm font-semibold truncate"
            style={{ color: "#EAF6FF" }}
          >
            {svc.name}
          </span>
          <span
            className="text-[11px] sm:text-xs shrink-0 tabular-nums"
            style={{ color: "rgba(234,246,255,0.55)" }}
          >
            Stop {gate + 1} of {N}
          </span>
        </div>

        <p
          className="text-[12px] sm:text-[13px] leading-snug mb-2.5"
          style={{ color: "rgba(234,246,255,0.72)", minHeight: "2.6em" }}
        >
          {open ? svc.description : svc.tagline}
        </p>

        <div
          className="flex gap-1 sm:gap-1.5 h-2.5 mb-2"
          role="group"
          aria-label="Jump to a service"
        >
          {SERVICES.map((s, i) => {
            const fill = Math.max(0, Math.min(1, progress * N - i));
            const active = i === gate;
            return (
              <button
                key={s.id}
                onClick={() => jumpTo(i)}
                title={s.name}
                aria-label={`Go to ${s.name}`}
                className="relative flex-1 rounded-full overflow-hidden transition-transform duration-200 hover:scale-y-150 focus:outline-none"
                style={{
                  background: "rgba(126,200,227,0.16)",
                  transform: active ? `scaleY(${1 + ignite * 0.6})` : undefined,
                  boxShadow: active ? `0 0 ${6 + ignite * 14}px ${s.tone}` : "none",
                }}
              >
                <div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${fill * 100}%`,
                    background: `linear-gradient(90deg, ${s.tone}, #D9B98A)`,
                  }}
                />
              </button>
            );
          })}
        </div>

        <div
          className="flex items-center justify-between text-[10px] sm:text-[11px]"
          style={{ color: "rgba(234,246,255,0.42)" }}
        >
          <span>
            {pct < 8
              ? "All noise so far"
              : pct < 45
                ? "Signal starting to form"
                : pct < 88
                  ? "Signal locking in"
                  : "Fully tuned"}
          </span>
          <span className="tabular-nums">{pct}% tuned</span>
        </div>
      </div>
    </div>
  );
}
