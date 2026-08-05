"use client";

import { useEffect, useRef, useState } from "react";
import { CREATOR_GROWTH, ROSTER_NOTE } from "@/lib/impact";

/* ──────────────────────────────────────────────────────────────────────────
   GrowthLedger.

   Three real creator growth stories rendered as an instrument, not a table.
   Each row is a track: a thin marker where the creator started and a filled
   bar that sweeps to where they ended, with the follower counter riding the
   bar's leading edge. The multiplier lands after the sweep finishes, which
   is deliberate sequencing: first you watch the distance travelled, then
   you get told what it amounts to.

   All three bars share one scale, the roster's largest end count. That is
   what makes the ledger honest: Ashmeet's bar is visibly four times
   Pranjali's because the numbers are, not because each row is normalised
   to look equally impressive.

   Numbers animate on the same cubic ease as StatsProof so the two proof
   beats feel like one instrument. Under prefers-reduced-motion the CSS
   kills the transition and the bars simply appear at their final width.
   ────────────────────────────────────────────────────────────────────────── */

const MAX = Math.max(...CREATOR_GROWTH.map((c) => c.to));
const SWEEP_MS = 1600;

function fmt(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k % 1 === 0 ? k : k.toFixed(1)}k`;
  }
  return String(n);
}

function Row({
  name,
  niche,
  from,
  to,
  window: win,
  active,
  delay,
}: (typeof CREATOR_GROWTH)[number] & { active: boolean; delay: number }) {
  const [count, setCount] = useState(from);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now() + delay;
    function tick(now: number) {
      const t = Math.min(1, Math.max(0, (now - start) / SWEEP_MS));
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDone(true);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, from, to, delay]);

  const fromPct = (from / MAX) * 100;
  const toPct = (to / MAX) * 100;
  const mult = Math.round((to / from) * 10) / 10;

  return (
    <div className="py-4 first:pt-0 last:pb-0" style={{ borderBottom: "1px solid rgba(126,200,227,0.25)" }}>
      <div className="flex items-baseline justify-between gap-3 mb-2.5">
        <p className="font-disp text-base sm:text-lg font-extrabold" style={{ color: "#2F5D7C" }}>
          {name}
          <span className="font-body text-xs font-medium ml-2" style={{ color: "#6f8ca3" }}>
            {niche}
          </span>
        </p>
        <p
          className="font-tech text-xs font-bold tabular-nums transition-opacity duration-500"
          style={{ color: "#D9B98A", opacity: done ? 1 : 0 }}
        >
          {mult}x in {win}
        </p>
      </div>

      <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "rgba(126,200,227,0.14)" }}>
        {/* Where they started. Stays put so the sweep has a visible origin. */}
        <div
          className="absolute inset-y-0 w-0.5"
          style={{ left: `${fromPct}%`, background: "rgba(47,93,124,0.45)" }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: active ? `${toPct}%` : `${fromPct}%`,
            background: "linear-gradient(90deg, #2F5D7C, #7EC8E3 70%, #D9B98A)",
            transition: `width ${SWEEP_MS}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
          }}
        />
      </div>

      <div className="flex items-baseline justify-between mt-1.5">
        <p className="font-tech text-[11px] tabular-nums" style={{ color: "#8aa3b5" }}>
          started {fmt(from)}
        </p>
        <p className="font-tech text-sm font-bold tabular-nums" style={{ color: "#2F5D7C" }}>
          {fmt(count)} followers
        </p>
      </div>
    </div>
  );
}

export function GrowthLedger() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          obs.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="rounded-2xl px-5 py-5 sm:px-7 sm:py-6 w-full"
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(126,200,227,0.45)",
        boxShadow: "0 20px 50px -24px rgba(47,93,124,0.55)",
      }}
    >
      {CREATOR_GROWTH.map((c, i) => (
        <Row key={c.name} {...c} active={active} delay={i * 260} />
      ))}
      <p className="text-xs leading-relaxed mt-4" style={{ color: "#6f8ca3" }}>
        {ROSTER_NOTE}
      </p>
    </div>
  );
}
