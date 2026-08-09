/* ──────────────────────────────────────────────────────────────────────────
   Bundle budget.

   Three.js is gone, and the point of this script now is to keep it gone,
   along with anything else of that weight. A single import of a heavy
   library reads as one line in a diff and as two seconds on a mid range
   phone. This fails the build instead of letting it land quietly.

   Run after next build:  node scripts/check-bundle.mjs
   ────────────────────────────────────────────────────────────────────────── */

import { readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const CHUNK_DIR = ".next/static/chunks";

// Total gzipped weight of everything shipped. A ceiling, not a target.
/*
  Was 450kb when the corridor shipped. The glass theme is CSS, so the honest
  ceiling is far lower. Tighten this to just above the real number once you
  have one from a full build, so the next heavy dependency trips it rather
  than hiding under headroom.
*/
const MAX_TOTAL_GZIP_KB = 320;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith(".js")) out.push(full);
  }
  return out;
}

const files = walk(CHUNK_DIR);
const failures = [];
let totalGzip = 0;

for (const file of files) {
  totalGzip += gzipSync(readFileSync(file), { level: 9 }).length;
}

/*
  Nothing should reintroduce a WebGL renderer. If one appears, either
  Three.js came back or a dependency quietly pulled in an equivalent, and
  either way the budget above stops meaning what it used to.
*/
const webglChunks = files.filter((f) =>
  readFileSync(f).includes("WebGLRenderer")
);

if (webglChunks.length > 0) {
  failures.push(
    `A WebGL renderer is back in the bundle (${webglChunks.length} chunk(s)). The site is CSS-only by design.`
  );
}

const totalKb = totalGzip / 1024;
console.log(`Total client JS: ${totalKb.toFixed(0)}kb gzipped`);

if (totalKb > MAX_TOTAL_GZIP_KB) {
  failures.push(
    `Total ${totalKb.toFixed(0)}kb gzipped exceeds the ${MAX_TOTAL_GZIP_KB}kb budget.`
  );
}

if (failures.length > 0) {
  console.error("\nBundle budget failed:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("Bundle budget passed.");
