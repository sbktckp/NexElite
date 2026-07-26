"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { SERVICES, type Service } from "@/lib/services";

export function ChannelGrid({
  onSelect,
}: {
  onSelect: (service: Service) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    function onMove(e: PointerEvent) {
      const grid = gridRef.current;
      if (!grid) return;
      const rect = grid.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(grid, {
        rotateY: px * 6,
        rotateX: -py * 6,
        duration: 0.6,
        ease: "power2.out",
      });
    }
    const grid = gridRef.current;
    grid?.addEventListener("pointermove", onMove);
    function onLeave() {
      gsap.to(grid, { rotateY: 0, rotateX: 0, duration: 0.8, ease: "power3.out" });
    }
    grid?.addEventListener("pointerleave", onLeave);

    return () => {
      grid?.removeEventListener("pointermove", onMove);
      grid?.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      className="w-full flex items-center justify-center"
      style={{ perspective: "1400px" }}
    >
      <div
        ref={gridRef}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-5xl"
        style={{ transformStyle: "preserve-3d" }}
      >
        {SERVICES.map((service, i) => {
          const Icon = service.icon;
          const isHovered = hovered === i;
          return (
            <button
              key={service.id}
              ref={(el) => {
                tileRefs.current[i] = el;
              }}
              onClick={() => onSelect(service)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="group relative aspect-[4/5] rounded-2xl p-4 sm:p-5 flex flex-col justify-between text-left overflow-hidden transition-all duration-300"
              style={{
                background: isHovered
                  ? `linear-gradient(155deg, ${service.tone}, #0d1620)`
                  : "linear-gradient(155deg, rgba(9,18,28,0.06), rgba(9,18,28,0.02))",
                border: `1px solid ${isHovered ? service.tone : "rgba(47,93,124,0.18)"}`,
                boxShadow: isHovered
                  ? `0 0 0 1px ${service.tone}, 0 24px 48px -16px ${service.tone}aa, 0 0 32px -4px ${service.tone}88`
                  : "0 4px 16px -8px rgba(47,93,124,0.15)",
                transform: isHovered ? "translateY(-8px) scale(1.03)" : "translateY(0) scale(1)",
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 3px)",
                }}
              />
              <span
                className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300"
                style={{
                  background: `linear-gradient(90deg, transparent, ${service.tone}, transparent)`,
                  opacity: isHovered ? 1 : 0,
                }}
              />

              <div className="flex items-center justify-between relative z-10">
                <span
                  className="text-[9px] sm:text-[10px] font-bold tracking-widest font-mono"
                  style={{ color: isHovered ? "rgba(255,255,255,0.8)" : "#7EC8E3" }}
                >
                  CH·{String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    background: isHovered ? "#ffffff" : service.tone,
                    boxShadow: isHovered ? "0 0 8px #ffffff" : `0 0 6px ${service.tone}`,
                  }}
                />
              </div>

              <div className="relative z-10">
                <Icon
                  className="w-6 h-6 sm:w-7 sm:h-7 mb-2 sm:mb-3 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    color: isHovered ? "#ffffff" : service.tone,
                    filter: isHovered ? "drop-shadow(0 0 6px rgba(255,255,255,0.6))" : "none",
                  }}
                />
                <p
                  className="font-disp font-bold leading-tight text-sm sm:text-base"
                  style={{ color: isHovered ? "#ffffff" : "#2F5D7C" }}
                >
                  {service.name}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
