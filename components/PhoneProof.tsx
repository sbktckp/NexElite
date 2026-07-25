"use client";

const GRID_TILES = [
  { label: "REEL", tone: "#2F5D7C" },
  { label: "BRAND", tone: "#7EC8E3" },
  { label: "PHOTO", tone: "#2F5D7C" },
  { label: "REEL", tone: "#7EC8E3" },
  { label: "MOTION", tone: "#2F5D7C" },
  { label: "REEL", tone: "#7EC8E3" },
];

export function PhoneProof() {
  return (
    <div className="relative mx-auto" style={{ width: 220, maxWidth: "60vw" }}>
      <div
        className="rounded-[2.2rem] p-2.5 shadow-2xl"
        style={{ background: "#2F5D7C", boxShadow: "0 30px 60px -20px rgba(47,93,124,0.35)" }}
      >
        <div className="rounded-[1.7rem] overflow-hidden" style={{ background: "#ffffff" }}>
          <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
            <span className="text-[8px] font-bold" style={{ color: "#2F5D7C" }}>9:41</span>
            <div className="w-14 h-3.5 rounded-full" style={{ background: "#EAF6FF" }} />
          </div>

          <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "rgba(47,93,124,0.1)" }}>
            <div className="w-6 h-6 rounded-full" style={{ background: "linear-gradient(135deg,#2F5D7C,#7EC8E3)" }} />
            <div className="flex-1">
              <div className="h-1.5 w-16 rounded-full mb-1" style={{ background: "#2F5D7C" }} />
              <div className="h-1 w-10 rounded-full" style={{ background: "#B6C7D6" }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-[2px] p-[2px]">
            {GRID_TILES.map((tile, i) => (
              <div
                key={i}
                className="aspect-[3/4] flex items-end p-1.5 relative overflow-hidden"
                style={{
                  background: `linear-gradient(160deg, ${tile.tone}22, ${tile.tone}55)`,
                }}
              >
                <span
                  className="text-[6px] font-bold tracking-wider uppercase px-1 py-0.5 rounded"
                  style={{ background: "rgba(255,255,255,0.85)", color: tile.tone }}
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
              <div key={i} className="w-3.5 h-3.5 rounded-md" style={{ background: i === 2 ? "#2F5D7C" : "#EAF6FF" }} />
            ))}
          </div>
        </div>
      </div>

      <div
        className="absolute -right-4 top-1/4 px-2.5 py-1.5 rounded-xl text-[9px] font-bold shadow-lg"
        style={{ background: "#ffffff", color: "#2F5D7C", border: "1px solid rgba(47,93,124,0.12)" }}
      >
        ▲ engagement
      </div>
      <div
        className="absolute -left-6 bottom-1/4 px-2.5 py-1.5 rounded-xl text-[9px] font-bold shadow-lg"
        style={{ background: "#2F5D7C", color: "#ffffff" }}
      >
        on brand
      </div>
    </div>
  );
}
