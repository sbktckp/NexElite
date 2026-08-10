"use client";

import { useEffect, useRef, useState } from "react";
import { onFrame } from "@/lib/frame";
import { scrollFraction, scrollToFraction } from "@/lib/scroll";

/**
 * JourneyHUD
 *
 * The reading position, set as the masthead's own bottom rule.
 *
 * It used to be eight anonymous ticks: a radar that told you where you were
 * in a sequence you could not name. Ticks are only legible if you already
 * know what the segments are, which is exactly the thing a first time
 * visitor does not. So it is now a chapter rail. The segments carry the
 * section names, they are real navigation, and the fill still reads as
 * progress.
 *
 * Rendered inside <header> in app/page.tsx. It positions itself against that
 * header, so it must not be mounted anywhere else.
 *
 * ── Why this reads smooth ──────────────────────────────────────────────
 * Split by rate of change. The continuous value, progress, is written to a
 * CSS custom property every frame and consumed by transform, so it moves at
 * display rate and costs no renders at all. The discrete values, active
 * chapter and rounded percentage, use state but are only set when they
 * actually change.
 *
 * It subscribes to the shared frame bus rather than running its own rAF, so
 * it samples scroll in the same frame Lenis settles it.
 */

const CHAPTERS = [
  { id: "channels", label: "Channels" },
  { id: "growth", label: "Growth" },
  { id: "impact", label: "Impact" },
  { id: "plans", label: "Plans" },
  { id: "creators", label: "Creators" },
  { id: "audit", label: "Audit" },
];

const SAMPLE_MS = 90;

/** Where a section sits as a fraction of the whole scrollable page. */
function fractionOf(id: string): number | null {
  const el = document.getElementById(id);
  if (!el) return null;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, (el.getBoundingClientRect().top + window.scrollY) / max));
}

export function JourneyHUD() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [pct, setPct] = useState(0);

  // Mirrors of the state above, so the frame loop can compare without
  // closing over stale values or re-subscribing on every change.
  const activeRef = useRef(0);
  const pctRef = useRef(0);
  const lastRef = useRef(0);

  // Section offsets are measured on mount and on resize rather than per
  // frame. getBoundingClientRect inside a scroll loop is the classic way to
  // make a smooth page stutter.
  const marksRef = useRef<number[]>([]);

  useEffect(() => {
    const measure = () => {
      marksRef.current = CHAPTERS.map((c) => fractionOf(c.id) ?? 1);
    };
    measure();
    window.addEventListener("resize", measure);
    // Fonts and images settle after first paint and move every offset, so
    // one late remeasure saves the rail from being wrong for a whole session.
    const t = window.setTimeout(measure, 900);

    const off = onFrame((now) => {
      const root = rootRef.current;
      if (!root) return;

      const p = scrollFraction();
      root.style.setProperty("--p", p.toFixed(4));

      if (now - lastRef.current < SAMPLE_MS) return;
      lastRef.current = now;

      let next = 0;
      marksRef.current.forEach((m, i) => {
        if (p >= m - 0.02) next = i;
      });
      if (next !== activeRef.current) {
        activeRef.current = next;
        setActive(next);
      }

      const np = Math.round(p * 100);
      if (np !== pctRef.current) {
        pctRef.current = np;
        setPct(np);
      }
    });

    return () => {
      off();
      window.clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="journey-hud absolute inset-x-0 bottom-0"
      style={{ ["--p" as string]: "0" }}
    >
      {/* The rule itself. Two layers: the hairline the masthead needs anyway,
          and the fill scaled across it. Scaling one element beats animating
          six widths, and transform never costs layout. */}
      <div className="relative h-px w-full" style={{ background: "var(--rule)" }}>
        <div
          className="absolute inset-y-0 left-0 w-full origin-left"
          style={{
            background:
              "linear-gradient(90deg, var(--accent-3), var(--accent-2), var(--accent))",
            transform: "scaleX(var(--p))",
            boxShadow: "0 0 10px rgba(53,208,216,0.5)",
          }}
        />
      </div>

      {/* Running head. Collapsed until the masthead is hovered, so at rest the
          page shows only the filled rule and the reader is never told what
          they can already see. */}
      <div
        className="hud-drawer"
        style={{ background: "rgba(10,13,24,0.72)", borderBottom: "1px solid var(--rule)" }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-6 flex items-center justify-between gap-4 pb-2">
          <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Sections">
            {CHAPTERS.map((c, i) => {
              const on = i === active;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    const f = fractionOf(c.id);
                    if (f !== null) scrollToFraction(f);
                  }}
                  aria-current={on ? "true" : undefined}
                  className="font-tech text-[10px] sm:text-[11px] uppercase tracking-[0.16em] px-2.5 py-1 whitespace-nowrap rounded-full transition-colors"
                  style={{
                    color: on ? "var(--ink)" : "var(--muted)",
                    background: on ? "rgba(255,255,255,0.09)" : "transparent",
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </nav>
          <p
            className="font-tech text-[10px] sm:text-[11px] shrink-0 tabular-nums tracking-[0.16em]"
            style={{ color: "var(--muted)" }}
          >
            {pct}%
          </p>
        </div>
      </div>
    </div>
  );
}
