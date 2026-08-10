"use client";

const GRID_TILES = [
  { label: "REEL", tone: "var(--ink)" },
  { label: "BRAND", tone: "var(--accent)" },
  { label: "PHOTO", tone: "var(--ink)" },
  { label: "REEL", tone: "var(--accent)" },
  { label: "MOTION", tone: "var(--ink)" },
  { label: "REEL", tone: "var(--accent)" },
];

export function PhoneProof() {
  return (
    <div className="relative mx-auto" style={{ width: 220, maxWidth: "60vw" }}>
      {/* The one rounded object on the site, because a phone is round. The
          shadow it used to cast is gone: nothing here is raised off the
          paper, so the device is drawn rather than photographed. */}
      <div className="rounded-[2.2rem] p-2.5" style={{ background: "var(--ink)" }}>
        <div className="rounded-[1.7rem] overflow-hidden" style={{ background: "var(--paper)" }}>
          <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
            <span className="text-[8px] font-bold" style={{ color: "var(--ink)" }}>9:41</span>
            <div className="w-14 h-3.5 rounded-full" style={{ background: "var(--paper-2)" }} />
          </div>

          <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "var(--rule)" }}>
            <div className="w-6 h-6 rounded-full" style={{ background: "var(--ink)" }} />
            <div className="flex-1">
              <div className="h-1.5 w-16 rounded-full mb-1" style={{ background: "var(--ink)" }} />
              <div className="h-1 w-10 rounded-full" style={{ background: "var(--muted)" }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-[2px] p-[2px]">
            {GRID_TILES.map((tile, i) => (
              <div
                key={i}
                className="aspect-[3/4] flex items-end p-1.5 relative overflow-hidden"
                style={{ background: "var(--paper-2)", border: "1px solid var(--rule)" }}
              >
                <span
                  className="text-[6px] font-bold tracking-wider uppercase px-1 py-0.5"
                  style={{ background: "var(--paper)", color: tile.tone }}
                >
                  {tile.label}
                </span>
                {i % 3 !== 2 && (
                  <svg
                    className="absolute top-1.5 right-1.5"
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill={tile.tone}
                    opacity={0.7}
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </div>
            ))}
          </div>

          <div className="px-3 py-2.5 flex justify-between">
            {["Feed", "Search", "Reels", "Profile"].map((_, i) => (
              <div key={i} className="w-3.5 h-3.5" style={{ background: i === 2 ? "var(--ink)" : "var(--paper-2)" }} />
            ))}
          </div>
        </div>
      </div>

      {/* Two pull quotes pinned to the device, set as marginalia rather than
          as floating chips: one reversed out of ink, one ruled on paper. */}
      <div
        className="absolute -right-4 top-1/4 px-2.5 py-1.5 font-tech text-[9px] font-bold uppercase tracking-[0.14em]"
        style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--rule-strong)" }}
      >
        Engagement up
      </div>
      <div
        className="absolute -left-6 bottom-1/4 px-2.5 py-1.5 font-tech text-[9px] font-bold uppercase tracking-[0.14em]"
        style={{ background: "var(--ink)", color: "var(--paper)" }}
      >
        On brand
      </div>
    </div>
  );
}
