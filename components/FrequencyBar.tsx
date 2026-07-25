"use client";

import { useEffect, useRef } from "react";

const BAR_COUNT = 64;

export function FrequencyBar({
  progressRef,
}: {
  progressRef: React.MutableRefObject<number>;
}) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const scrollFracRef = useRef(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function onScroll() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      scrollFracRef.current = max > 0 ? window.scrollY / max : 0;

      if (reduced) {
        const tunedCount = Math.round(scrollFracRef.current * BAR_COUNT);
        barsRef.current.forEach((el, i) => {
          if (!el) return;
          el.style.height = "60%";
          el.style.opacity = i < tunedCount ? "1" : "0.25";
          el.style.background = i < tunedCount ? "#2F5D7C" : "#B6C7D6";
        });
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (reduced) {
      return () => window.removeEventListener("scroll", onScroll);
    }

    let raf = 0;
    let t = 0;
    function tick() {
      t += 0.045;
      const frac = scrollFracRef.current;
      const tunedCount = Math.round(frac * BAR_COUNT);

      barsRef.current.forEach((el, i) => {
        if (!el) return;
        const isTuned = i < tunedCount;
        if (isTuned) {
          const wobble = Math.sin(t * 1.6 + i * 0.4) * 0.08;
          el.style.height = `${62 + wobble * 100}%`;
          el.style.opacity = "1";
          el.style.background = i % 5 === 0 ? "#D9B98A" : "#2F5D7C";
        } else {
          const noise = Math.abs(Math.sin(t * 3.1 + i * 1.7)) * 0.85 + 0.1;
          el.style.height = `${noise * 100}%`;
          el.style.opacity = "0.35";
          el.style.background = "#B6C7D6";
        }
      });

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [progressRef]);

  return (
    <div
      className="fixed top-0 inset-x-0 flex items-stretch h-[3px] sm:h-1"
      style={{ zIndex: 50, background: "rgba(255,255,255,0.6)", backdropFilter: "blur(2px)" }}
      role="progressbar"
      aria-label="Scroll progress"
    >
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <div key={i} className="flex-1 flex items-end px-px">
          <div
            ref={(el) => {
              barsRef.current[i] = el;
            }}
            className="w-full transition-[background] duration-300"
            style={{ height: "20%", background: "#B6C7D6", opacity: 0.35 }}
          />
        </div>
      ))}
    </div>
  );
}
