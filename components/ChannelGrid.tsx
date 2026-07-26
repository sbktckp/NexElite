"use client";

import { useRef, useState } from "react";
import { SERVICES, type Service } from "@/lib/services";

export function ChannelGrid({
  onSelect,
}: {
  onSelect: (service: Service) => void;
}) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    const N = SERVICES.length;
    let next = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      next = (i + 1) % N;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      next = (i - 1 + N) % N;
    } else if (e.key === "Home") {
      next = 0;
    } else if (e.key === "End") {
      next = N - 1;
    } else {
      return;
    }
    e.preventDefault();
    btnRefs.current[next]?.focus();
  }

  return (
    <div
      role="list"
      aria-label="NexElite service channels"
      className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-5xl mx-auto"
    >
      {SERVICES.map((service, i) => {
        const Icon = service.icon;
        const isFocused = focusedIndex === i;
        return (
          <button
            key={service.id}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            role="listitem"
            onClick={() => onSelect(service)}
            onFocus={() => setFocusedIndex(i)}
            onBlur={() => setFocusedIndex((cur) => (cur === i ? null : cur))}
            onMouseEnter={() => setFocusedIndex(i)}
            onMouseLeave={() => setFocusedIndex((cur) => (cur === i ? null : cur))}
            onKeyDown={(e) => onKeyDown(e, i)}
            aria-label={`${service.name}: ${service.tagline}. Open details.`}
            className="group relative aspect-[4/5] rounded-2xl p-4 sm:p-5 flex flex-col justify-between text-left overflow-hidden transition-all duration-300 focus:outline-none focus-visible:ring-4"
            style={{
              background: isFocused
                ? `linear-gradient(155deg, ${service.tone}, #0d1620)`
                : "linear-gradient(155deg, rgba(9,18,28,0.06), rgba(9,18,28,0.02))",
              border: `1px solid ${isFocused ? service.tone : "rgba(47,93,124,0.18)"}`,
              boxShadow: isFocused
                ? `0 0 0 1px ${service.tone}, 0 24px 48px -16px ${service.tone}aa, 0 0 32px -4px ${service.tone}88`
                : "0 4px 16px -8px rgba(47,93,124,0.15)",
              transform: isFocused ? "translateY(-8px) scale(1.03)" : "translateY(0) scale(1)",
              // @ts-expect-error -- CSS custom property for focus ring color
              "--tw-ring-color": service.tone,
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
                opacity: isFocused ? 1 : 0,
              }}
            />

            <div className="flex items-center justify-between relative z-10">
              <span
                className="text-[9px] sm:text-[10px] font-bold tracking-widest font-mono"
                style={{ color: isFocused ? "rgba(255,255,255,0.8)" : "#7EC8E3" }}
                aria-hidden="true"
              >
                CH·{String(i + 1).padStart(2, "0")}
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                aria-hidden="true"
                style={{
                  background: isFocused ? "#ffffff" : service.tone,
                  boxShadow: isFocused ? "0 0 8px #ffffff" : `0 0 6px ${service.tone}`,
                }}
              />
            </div>

            <div className="relative z-10">
              <Icon
                aria-hidden="true"
                className="w-6 h-6 sm:w-7 sm:h-7 mb-2 sm:mb-3 transition-transform duration-300 group-hover:scale-110"
                style={{
                  color: isFocused ? "#ffffff" : service.tone,
                  filter: isFocused ? "drop-shadow(0 0 6px rgba(255,255,255,0.6))" : "none",
                }}
              />
              <p
                className="font-disp font-bold leading-tight text-sm sm:text-base"
                style={{ color: isFocused ? "#ffffff" : "#2F5D7C" }}
              >
                {service.name}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
