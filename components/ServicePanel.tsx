"use client";

import { useEffect, useRef } from "react";
import { X, ArrowUpRight } from "lucide-react";
import type { Service } from "@/lib/services";
import gsap from "gsap";

export function ServicePanel({
  service,
  onClose,
}: {
  service: Service | null;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!service) return;
    document.body.style.overflow = "hidden";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduced && panelRef.current && scrimRef.current) {
      gsap.fromTo(
        scrimRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power2.out" }
      );
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, scale: 0.94, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "power3.out" }
      );
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [service, onClose]);

  if (!service) return null;
  const Icon = service.icon;

  return (
    <div
      ref={scrimRef}
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-6"
      style={{ zIndex: 100, background: "rgba(20,32,42,0.55)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="relative w-full rounded-3xl overflow-y-auto"
        style={{
          maxWidth: "1000px",
          height: "80vh",
          background: "#ffffff",
          boxShadow: "0 40px 100px -20px rgba(47,93,124,0.4)",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ background: `linear-gradient(90deg, ${service.tone}, #D9B98A)` }}
        />

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 sm:top-7 sm:right-7 w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 hover:rotate-90 duration-300"
          style={{ background: "rgba(126,200,227,0.14)", color: "#2F5D7C", zIndex: 5 }}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 sm:px-14 pt-10 sm:pt-16 pb-10 sm:pb-14">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: `${service.tone}18`, color: service.tone }}
          >
            <Icon className="w-7 h-7" />
          </div>

          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: service.tone }}
          >
            {service.tagline}
          </p>
          <h2
            className="font-disp font-extrabold mb-5"
            style={{
              fontSize: "clamp(30px, 5vw, 48px)",
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              color: "#2F5D7C",
            }}
          >
            {service.name}
          </h2>
          <p
            className="text-base sm:text-lg leading-relaxed mb-10 sm:mb-12"
            style={{ color: "#6f8ca3", maxWidth: "60ch" }}
          >
            {service.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8 mb-10 sm:mb-14">
            {service.kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-2xl p-6 sm:p-7"
                style={{ background: "#EAF6FF", border: "1px solid rgba(47,93,124,0.1)" }}
              >
                <p
                  className="font-disp font-extrabold mb-2"
                  style={{ fontSize: "clamp(30px, 4vw, 40px)", color: "#2F5D7C", letterSpacing: "-0.02em" }}
                >
                  {kpi.value}
                </p>
                <p className="text-xs sm:text-sm uppercase tracking-wide" style={{ color: "#6f8ca3" }}>
                  {kpi.label}
                </p>
              </div>
            ))}
          </div>

          <a
            href={`mailto:nexelitemedia@gmail.com?subject=${encodeURIComponent(service.ctaSubject)}`}
            className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-xl text-base transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: service.tone, color: "#ffffff" }}
          >
            {service.ctaLabel} <ArrowUpRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
}
