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
      className="glass-thick glass-edge fixed bottom-5 right-5 sm:bottom-7 sm:right-7 flex items-center gap-2 font-bold text-sm px-5 py-3 rounded-full transition-all duration-300"
      style={{
        zIndex: 12,
        color: "#2F5D7C",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.92)",
        pointerEvents: visible ? "auto" : "none",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.95), 0 18px 44px -16px rgba(47,93,124,0.5)",
      }}
    >
      Start a project
      <ArrowUpRight className="w-4 h-4" />
    </a>
  );
}
