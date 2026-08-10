"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";

export function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > window.innerHeight * 0.7);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href="mailto:nexelitemedia@gmail.com"
      className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 flex items-center gap-2 font-tech text-[11px] font-bold uppercase tracking-[0.18em] px-5 py-3.5 transition-all duration-300"
      style={{
        zIndex: 12,
        background: "var(--ink)",
        color: "var(--paper)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      Start a project
      <ArrowUpRight className="w-4 h-4" />
    </a>
  );
}
