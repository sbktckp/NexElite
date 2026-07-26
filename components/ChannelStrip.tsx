"use client";

import { useEffect, useRef, useState } from "react";
import { SERVICES } from "@/lib/services";

export function ChannelStrip() {
  const [progress, setProgress] = useState(0);
  const [activeSeg, setActiveSeg] = useState(0);
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
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
    <>
      {/* Desktop: thick vertical strip, floats in left gutter */}
      <div
        className="fixed left-3 top-1/2 -translate-y-1/2 hidden xl:flex flex-col z-40 gap-1.5"
        style={{ width: "56px", height: "62vh" }}
      >
        {SERVICES.map((s, i) => {
          const isActive = i === activeSeg;
          const segFillFrac = Math.max(0, Math.min(1, progress * N - i));
          return (
            <button
              key={s.id}
              onClick={() => jumpTo(i)}
              className="group relative flex-1 rounded-lg overflow-hidden transition-all duration-300"
              style={{
                background: "rgba(182,199,214,0.25)",
                outline: isActive ? `2px solid ${s.tone}` : "none",
                outlineOffset: "2px",
              }}
              aria-label={`Jump to ${s.name}`}
              title={s.name}
            >
              <div
                className="absolute inset-x-0 bottom-0 transition-all duration-200"
                style={{
                  height: `${segFillFrac * 100}%`,
                  background: `linear-gradient(180deg, ${s.tone}, #D9B98A)`,
                }}
              />
              <span
                className="absolute inset-0 flex items-center justify-center text-[9px] font-bold rotate-180"
                style={{
                  writingMode: "vertical-rl",
                  color: segFillFrac > 0.5 ? "#ffffff" : "#6f8ca3",
                  letterSpacing: "0.05em",
                }}
              >
                {s.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile/tablet: thick horizontal strip pinned to top */}
      <div
        className="fixed top-0 inset-x-0 flex xl:hidden z-40 h-3 gap-[3px] px-[3px] pt-[3px]"
      >
        {SERVICES.map((s, i) => {
          const segFillFrac = Math.max(0, Math.min(1, progress * N - i));
          return (
            <div
              key={s.id}
              className="flex-1 rounded-full overflow-hidden"
              style={{ background: "rgba(182,199,214,0.35)" }}
            >
              <div
                className="h-full transition-all duration-200"
                style={{
                  width: `${segFillFrac * 100}%`,
                  background: `linear-gradient(90deg, ${s.tone}, #D9B98A)`,
                }}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
