"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { SERVICES } from "@/lib/services";

const OrbitalTrack = dynamic(
  () => import("./OrbitalTrack").then((m) => m.OrbitalTrack),
  { ssr: false }
);

export function ChannelStrip() {
  const [progress, setProgress] = useState(0);
  const [activeSeg, setActiveSeg] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const N = SERVICES.length;

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const frac = max > 0 ? window.scrollY / max : 0;
      setProgress(frac);
      setActiveSeg(Math.min(N - 1, Math.floor(frac * N)));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [N]);

  function jumpTo(i: number) {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    window.scrollTo({ top: (i / N) * max + 40, behavior: "smooth" });
  }

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(94vw,720px)]"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={() => setExpanded(false)}
    >
      <div
        className="rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 transition-all duration-300"
        style={{
          background: "rgba(9,18,28,0.72)",
          backdropFilter: "blur(18px)",
          border: "1px solid rgba(126,200,227,0.35)",
          boxShadow: expanded
            ? "0 0 0 1px rgba(126,200,227,0.5), 0 20px 60px -12px rgba(47,93,124,0.6), 0 0 40px -8px rgba(126,200,227,0.4)"
            : "0 0 0 1px rgba(126,200,227,0.15), 0 12px 32px -12px rgba(47,93,124,0.4)",
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase"
            style={{ color: "#7EC8E3" }}
          >
            {SERVICES[activeSeg].name}
          </span>
          <span
            className="text-[9px] sm:text-[10px] font-mono"
            style={{ color: "rgba(234,246,255,0.5)" }}
          >
            {String(activeSeg + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
          </span>
        </div>

        <div
          className="w-full overflow-hidden transition-all duration-300"
          style={{ height: expanded ? "44px" : "0px" }}
        >
          <div className="h-[44px]">
            <OrbitalTrack progress={progress} />
          </div>
        </div>

        <div className="flex gap-1 sm:gap-1.5 h-2.5 sm:h-3 mt-1.5" role="group" aria-label="Jump to service">
          {SERVICES.map((s, i) => {
            const segFillFrac = Math.max(0, Math.min(1, progress * N - i));
            const isActive = i === activeSeg;
            return (
              <button
                key={s.id}
                onClick={() => jumpTo(i)}
                className="group relative flex-1 rounded-full overflow-hidden transition-transform duration-200 hover:scale-y-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-[#09121c]"
                style={{
                  background: "rgba(126,200,227,0.15)",
                  boxShadow: isActive ? `0 0 10px ${s.tone}` : "none",
                  // @ts-expect-error -- CSS custom property for focus ring color
                  "--tw-ring-color": s.tone,
                }}
                aria-label={`Jump to ${s.name}`}
              >
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-200"
                  style={{
                    width: `${segFillFrac * 100}%`,
                    background: `linear-gradient(90deg, ${s.tone}, #D9B98A)`,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
