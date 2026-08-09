"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 40, suffix: "M+", label: "views delivered" },
  { value: 60, suffix: "+", label: "brands launched" },
  { value: 48, suffix: "hr", label: "avg turnaround" },
];

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return val;
}

function StatItem({
  value,
  suffix,
  label,
  active,
  stacked,
}: {
  value: number;
  suffix: string;
  label: string;
  active: boolean;
  stacked?: boolean;
}) {
  const count = useCountUp(value, active);

  // Stacked is the panel form used in a stage's aside column: number and
  // label sit on one baseline with a rule between rows, which reads as a
  // record rather than three floating figures.
  if (stacked) {
    return (
      <div
        className="flex items-baseline justify-between gap-4 py-4 first:pt-0 last:pb-0"
        style={{ borderBottom: "1px solid rgba(126,200,227,0.28)" }}
      >
        <p className="font-tech text-[11px] uppercase tracking-[0.18em] font-bold" style={{ color: "#8aa3b5" }}>
          {label}
        </p>
        <p
          className="font-disp font-extrabold tabular-nums"
          style={{ fontSize: "clamp(30px, 4.4vw, 46px)", color: "#2F5D7C", letterSpacing: "-0.02em", lineHeight: 1 }}
        >
          {count}
          {suffix}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center sm:text-left">
      <p className="font-disp font-extrabold" style={{ fontSize: "clamp(32px, 6vw, 52px)", color: "#2F5D7C", letterSpacing: "-0.02em" }}>
        {count}
        {suffix}
      </p>
      <p className="text-xs sm:text-sm uppercase tracking-wider mt-1" style={{ color: "#6f8ca3" }}>
        {label}
      </p>
    </div>
  );
}

export function StatsProof({ stacked = false }: { stacked?: boolean }) {
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
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (stacked) {
    return (
      <div
        ref={ref}
        className="glass glass-edge lift rounded-2xl px-5 py-5 sm:px-7 sm:py-6 w-full"
      >
        {STATS.map((s) => (
          <StatItem key={s.label} {...s} active={active} stacked />
        ))}
        <p className="text-[11px] leading-relaxed mt-4" style={{ color: "#8aa3b5" }}>
          Counted across every channel we run, since launch.
        </p>
      </div>
    );
  }

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-2">
      {STATS.map((s) => (
        <StatItem key={s.label} {...s} active={active} />
      ))}
    </div>
  );
}
