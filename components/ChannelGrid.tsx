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
            className="group relative aspect-[4/5] p-4 sm:p-5 flex flex-col justify-between text-left overflow-hidden transition-colors duration-300 focus:outline-none focus-visible:ring-4"
            style={{
              /*
                Focus is carried by ink, not by lift. The tile fills with its
                own tone and the type reverses out of it, which is what a
                printed catalogue does to mark the entry you are on. No
                raise and no glow: nothing else on this page is raised.
              */
              background: isFocused ? service.tone : "transparent",
              border: `1px solid ${isFocused ? service.tone : "var(--rule)"}`,
              // @ts-expect-error -- CSS custom property for focus ring color
              "--tw-ring-color": service.tone,
            }}
          >
            <span
              className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300"
              style={{
                background: service.tone,
                opacity: isFocused ? 1 : 0,
              }}
            />

            <div className="flex items-center justify-between relative z-10">
              <span
                className="text-[9px] sm:text-[10px] font-bold tracking-widest font-mono"
                style={{ color: isFocused ? "rgba(251,248,243,0.75)" : "var(--accent)" }}
                aria-hidden="true"
              >
                CH·{String(i + 1).padStart(2, "0")}
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
                aria-hidden="true"
                style={{
                  background: isFocused ? "var(--paper)" : service.tone,
                }}
              />
            </div>

            <div className="relative z-10">
              <Icon
                aria-hidden="true"
                className="w-6 h-6 sm:w-7 sm:h-7 mb-2 sm:mb-3"
                style={{
                  color: isFocused ? "var(--paper)" : service.tone,
                }}
              />
              <p
                className="font-disp leading-tight text-base sm:text-lg"
                style={{ color: isFocused ? "var(--paper)" : "var(--ink)", fontWeight: 700 }}
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
