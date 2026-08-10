"use client";

/**
 * PaperGround
 *
 * Keeps its name because every import already points here. What it draws is
 * now an aurora field: three slow colour masses behind the glass, plus a
 * faint column grid so the layout still has something to sit on.
 *
 * Fixed rather than scrolled, animated with transform only, and pointer
 * events off, so it costs nothing during a scroll.
 */
export function PaperGround() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden
    >
      <div
        className="aurora aurora-a"
        style={{
          top: "-12%",
          left: "-8%",
          width: "58vw",
          height: "58vw",
          background: "var(--accent-3)",
          opacity: 0.24,
        }}
      />
      <div
        className="aurora aurora-b"
        style={{
          top: "28%",
          right: "-14%",
          width: "52vw",
          height: "52vw",
          background: "var(--accent-2)",
          opacity: 0.17,
        }}
      />
      <div
        className="aurora aurora-a"
        style={{
          bottom: "-18%",
          left: "22%",
          width: "46vw",
          height: "46vw",
          background: "var(--accent)",
          opacity: 0.15,
          animationDelay: "-9s",
        }}
      />

      {/* The column grid the stages align to, held at the threshold of
          visibility. Present enough that the layout reads as ruled, faint
          enough that it never competes with the aurora behind it. */}
      <div
        className="absolute inset-0 max-w-6xl mx-auto hidden md:grid grid-cols-12 gap-x-6 px-6"
        style={{ opacity: 0.5 }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{ borderLeft: "1px solid rgba(255,255,255,0.035)" }} />
        ))}
      </div>
    </div>
  );
}
