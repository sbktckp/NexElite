"use client";

import { Video, Megaphone, Camera, Share2, Sparkles, Radio } from "lucide-react";

const SERVICES = [
  { icon: Video, title: "Short-form & reels", note: "Cut for the scroll, built for retention", bar: "#7EC8E3" },
  { icon: Megaphone, title: "Brand campaigns", note: "Concept through delivery, one team", bar: "#2F5D7C" },
  { icon: Camera, title: "Photography", note: "Product, lifestyle, and event coverage", bar: "#7EC8E3" },
  { icon: Share2, title: "Social strategy", note: "Calendars, community, and growth loops", bar: "#2F5D7C" },
  { icon: Sparkles, title: "Motion design", note: "Titles, transitions, brand animation", bar: "#7EC8E3" },
  { icon: Radio, title: "Full production", note: "On-site crew, edit, and post — end to end", bar: "#2F5D7C" },
];

export function Services() {
  return (
    <section className="relative py-24 sm:py-32 px-5 sm:px-6" style={{ zIndex: 2 }}>
      <div className="max-w-6xl mx-auto">
        <p className="text-[11px] tracking-[0.4em] uppercase mb-4" style={{ color: "var(--cyan)" }}>
          Channels
        </p>
        <h2
          className="font-disp font-extrabold mb-14"
          style={{ fontSize: "clamp(28px, 6vw, 48px)", letterSpacing: "-0.02em" }}
        >
          What we broadcast
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="relative p-5 sm:p-6 overflow-hidden transition-transform duration-200 hover:-translate-y-1"
                style={{ background: "var(--tint)", border: "1px solid var(--line)" }}
              >
                <span className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: s.bar }} />
                <Icon className="w-5 h-5 mb-4" style={{ color: s.bar }} />
                <h3 className="font-disp font-bold text-base sm:text-lg mb-1.5">{s.title}</h3>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--dim)" }}>
                  {s.note}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
