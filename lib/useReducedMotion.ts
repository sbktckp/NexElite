"use client";

/* ──────────────────────────────────────────────────────────────────────────
   One source of truth for prefers-reduced-motion.

   Previously each component ran setState inside an effect, which meant two
   things went wrong. React flagged cascading renders, and more importantly
   the page rendered a blank placeholder on the first pass because the value
   started as null. That blank pass was the largest contentful paint, so the
   hero copy did not exist in the first frame the visitor saw.

   useSyncExternalStore reads the media query during render with a server
   snapshot of false, so the hero ships in the very first HTML payload and
   the corridor is the only thing that waits.
   ────────────────────────────────────────────────────────────────────────── */

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

// The server cannot know the preference. Assume motion is allowed so the
// full markup is streamed, then correct on hydration if the user opted out.
function getServerSnapshot() {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
