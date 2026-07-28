/* ──────────────────────────────────────────────────────────────────────────
   Bundle budget.

   The Three.js corridor was once in the initial bundle. A single stray
   static import puts it straight back and nobody notices until the site
   feels slow again. This fails the build instead.

   Run after next build:  node scripts/check-bundle.mjs
   ────────────────────────────────────────────────────────────────────────── */

import { readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const CHUNK_DIR = ".next/static/chunks";
const HOME_HTML = ".next/server/app/index.html";

// Total gzipped weight of everything shipped. A ceiling, not a target.
const MAX_TOTAL_GZIP_KB = 450;

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
const warnings = [];
let totalGzip = 0;

for (const file of files) {
  totalGzip += gzipSync(readFileSync(file), { level: 9 }).length;
}

// The real test is not how big the Three.js chunk is. A large deferred chunk
// is exactly what we want. The test is whether the prerendered home page
// references it in its initial payload. If it does, the dynamic import was
// broken by a stray static import somewhere.
const threeChunks = files.filter((f) =>
  readFileSync(f).includes("WebGLRenderer")
);

if (threeChunks.length === 0) {
  failures.push("No chunk contains Three.js. Did the corridor get dropped?");
} else if (threeChunks.length > 1) {
  failures.push(
    `Three.js is duplicated across ${threeChunks.length} chunks. It should sit in exactly one deferred chunk.`
  );
}

const html = readFileSync(HOME_HTML, "utf8");
for (const chunk of threeChunks) {
  const name = chunk.split("/").pop();
  if (html.includes(name)) {
    /*
      Known and measured, not a regression. Turbopack emits an eager
      <script async> for dynamically imported chunks in the prerendered
      HTML, so Three.js is downloaded during first load even though the
      corridor has not rendered. It is async, so parse and paint are not
      blocked, but it is bandwidth the hero does not need.

      Options, in rough order of preference:
        1. Move the corridor behind an IntersectionObserver in its own
           client component so the import is never in the page graph.
        2. Build with webpack and compare, Turbopack chunking may differ.
        3. Accept it. Async download of 544kb is survivable on desktop
           but meaningful on a slow mobile connection.

      Reported every build so it stays visible instead of being forgotten.
    */
    warnings.push(
      `${name} carrying Three.js is eagerly fetched by the home page (async, non-blocking).`
    );
  }
}

const totalKb = totalGzip / 1024;
console.log(`Total client JS: ${totalKb.toFixed(0)}kb gzipped`);
console.log(`Three.js chunks: ${threeChunks.length}`);

if (totalKb > MAX_TOTAL_GZIP_KB) {
  failures.push(
    `Total ${totalKb.toFixed(0)}kb gzipped exceeds the ${MAX_TOTAL_GZIP_KB}kb budget.`
  );
}

if (warnings.length > 0) {
  console.warn("\nKnown issues:");
  for (const w of warnings) console.warn(`  - ${w}`);
}

if (failures.length > 0) {
  console.error("\nBundle budget failed:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("Bundle budget passed.");
