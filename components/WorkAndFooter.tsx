"use client";

import dynamic from "next/dynamic";

const TapeDrum = dynamic(
  () => import("./TapeDrum").then((m) => m.TapeDrum),
  { ssr: false }
);

export function Work() {
  return (
    <section id="work" className="relative py-24 sm:py-32 px-5 sm:px-6" style={{ zIndex: 2 }}>
      <div className="max-w-6xl mx-auto">
        <p className="text-[11px] tracking-[0.4em] uppercase mb-4" style={{ color: "var(--magenta)" }}>
          Now playing
        </p>
        <h2
          className="font-disp font-extrabold mb-4"
          style={{ fontSize: "clamp(28px, 6vw, 48px)", letterSpacing: "-0.02em" }}
        >
          Recent reels
        </h2>
        <p className="max-w-md text-sm sm:text-base mb-10" style={{ color: "var(--dim)" }}>
          A rack of recent work. Drag the tapes, or scroll to spin the drum.
        </p>
        <TapeDrum />
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section className="relative py-24 sm:py-32 px-5 sm:px-6 text-center" style={{ zIndex: 2 }}>
      <div className="max-w-xl mx-auto">
        <h2
          className="font-disp font-extrabold mb-5"
          style={{ fontSize: "clamp(32px, 6vw, 56px)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
        >
          Ready to go on air?
        </h2>
        <p className="mb-10 text-base" style={{ color: "var(--dim)" }}>
          Tell us what you&apos;re building. We&apos;ll tell you how it looks in motion.
        </p>
        <a
          href="mailto:nexelitemedia@gmail.com"
          className="inline-flex items-center gap-2 font-bold px-9 py-3.5 text-sm transition-transform hover:-translate-y-0.5"
          style={{ background: "var(--phosphor)", color: "var(--ink)" }}
        >
          nexelitemedia@gmail.com
        </a>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer
      className="relative px-5 sm:px-6 py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] tracking-[0.12em] uppercase"
      style={{ zIndex: 2, color: "var(--dim)", borderTop: "1px solid var(--line)", background: "rgba(0,0,0,0.6)" }}
    >
      <span className="flex items-center gap-2">
        <span className="w-1.5 h-1.5" style={{ background: "var(--cyan)" }} />
        Standby
      </span>
      <span>© 2026 NexElite Media</span>
    </footer>
  );
}
