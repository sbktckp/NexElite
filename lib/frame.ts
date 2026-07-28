/* ──────────────────────────────────────────────────────────────────────────
   One clock.

   Lenis was running its own requestAnimationFrame loop while the Three.js
   corridor ran renderer.setAnimationLoop. Two independent callbacks meant
   scroll position and camera position were resolved in different frames,
   so under load the corridor drifted a frame behind the page. That is the
   residual judder that survives every other optimisation.

   Now nothing owns the clock. Both subscribe here, and this runs exactly
   one rAF for the whole site. Order is registration order, and Lenis
   subscribes first so scroll is settled before anything reads it.

   The loop stops entirely when the tab is hidden and when nothing is
   subscribed, so a backgrounded tab costs nothing.
   ────────────────────────────────────────────────────────────────────────── */

type FrameFn = (time: number) => void;

const subscribers = new Set<FrameFn>();
let rafId = 0;
let running = false;

function tick(time: number) {
  // Copy before iterating. A subscriber may unsubscribe itself mid frame.
  for (const fn of Array.from(subscribers)) {
    fn(time);
  }
  rafId = requestAnimationFrame(tick);
}

function start() {
  if (running || subscribers.size === 0 || document.hidden) return;
  running = true;
  rafId = requestAnimationFrame(tick);
}

function stop() {
  if (!running) return;
  running = false;
  cancelAnimationFrame(rafId);
  rafId = 0;
}

let visibilityBound = false;
function bindVisibility() {
  if (visibilityBound) return;
  visibilityBound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
}

/** Subscribe to the shared frame loop. Returns an unsubscribe function. */
export function onFrame(fn: FrameFn): () => void {
  if (typeof window === "undefined") return () => {};
  bindVisibility();
  subscribers.add(fn);
  start();
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0) stop();
  };
}
