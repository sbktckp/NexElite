/* ──────────────────────────────────────────────────────────────────────────
   PaperGround

   The page's underlying grid, drawn faintly, the way a printed spread lets
   you feel its columns without ruling them.

   Twelve hairlines at the container's own column positions, masked so they
   fade out top and bottom rather than running edge to edge like a table.
   That is the whole component.

   Deliberately static and deliberately not a client component. The theme
   before this one had a background that read scroll every frame to drift
   coloured light around; it was the right call for glass, which needs
   something moving behind it to refract. Paper needs the opposite. A
   printed grid that breathes is a screensaver.

   Zero JavaScript ships for this.
   ────────────────────────────────────────────────────────────────────────── */

const COLUMNS = 12;

export function PaperGround() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    >
      {/* The column rules, held to the same max width and padding as every
          section on the page, so they line up with the content instead of
          sitting behind it at a different rhythm. */}
      <div
        className="mx-auto h-full max-w-6xl px-5 sm:px-6"
        style={{
          maskImage:
            "linear-gradient(180deg, transparent 0%, #000 18%, #000 82%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 0%, #000 18%, #000 82%, transparent 100%)",
        }}
      >
        <div className="grid h-full grid-cols-4 md:grid-cols-12">
          {Array.from({ length: COLUMNS }).map((_, i) => (
            <div
              key={i}
              className={i > 3 ? "hidden md:block" : ""}
              style={{ borderLeft: "1px solid rgba(23,20,15,0.045)" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
