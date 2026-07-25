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
      className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 flex items-center gap-2 font-bold text-sm px-5 py-3 rounded-full shadow-2xl transition-all duration-300"
      style={{
        zIndex: 12,
        background: "#2F5D7C",
        color: "#ffffff",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.92)",
        pointerEvents: visible ? "auto" : "none",
        boxShadow: "0 12px 32px -8px rgba(47,93,124,0.5)",
      }}
    >
      Start a project
      <ArrowUpRight className="w-4 h-4" />
    </a>
  );
}
