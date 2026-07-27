"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SERVICES } from "@/lib/services";

/**
 * SignalCorridor — "every channel starts as noise."
 *
 * The page's own headline is the mechanic. You begin inside a cloud of
 * incoherent static: ~1400 particles scattered through a fat cylinder,
 * jittering at random. As you scroll, each particle RESOLVES — migrating
 * from its chaos position to an ordered position on a ring around the
 * corridor axis, its jitter damping to zero and its colour shifting from
 * dead grey to brand sky/sand. By the end of the page the static has
 * become architecture, then collapses to a single axis of light.
 *
 * Nothing morphs into a logo and nothing spells a word. The transformation
 * is noise → structure, which is the one claim the agency actually makes.
 *
 * ── Construction ──────────────────────────────────────────────────────────
 * Every particle carries THREE positions as attributes, all precomputed:
 *   aChaos  — where it starts, random in a cylinder
 *   aOrder  — where it belongs, on a Frenet-framed ring around the spline
 *   aCenter — the spline point itself, for the final collapse
 * The vertex shader mixes between them. No per-frame CPU particle work.
 *
 * Resolve is staggered by seed, so the field doesn't snap all at once —
 * it crystallises unevenly, front to back, like a signal locking in.
 *
 * Scroll VELOCITY drives a camera FOV punch and particle scale, so fast
 * scrolling feels like acceleration rather than scrubbing. That single
 * detail is most of what separates "3D on a page" from "a ride".
 *
 * ── Art direction ─────────────────────────────────────────────────────────
 * This layer sits behind page copy at z-index 0, so gates ignite on
 * APPROACH and dissolve at the pass-through — peaking opacity while the
 * ring engulfs the viewport would park a hard hoop behind the text.
 *
 * ── Diagnostics ───────────────────────────────────────────────────────────
 * `?debug=1` shows status, canvas size, progress, camera depth, resolve.
 */

export const corridorProgress = { value: 0, live: false };

type Status =
  | "booting"
  | "reduced-motion"
  | "webgl-unavailable"
  | "no-mount"
  | "running";

export function SignalCorridor() {
  const mountRef = useRef<HTMLDivElement>(null);
  const bootedRef = useRef(false);
  const [status, setStatus] = useState<Status>("booting");
  const [debugLine, setDebugLine] = useState("");
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    setShowDebug(
      typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).has("debug")
    );
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      setStatus("no-mount");
      return;
    }
    if (bootedRef.current) return;
    bootedRef.current = true;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setStatus("reduced-motion");
      bootedRef.current = false;
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      });
    } catch {
      setStatus("webgl-unavailable");
      bootedRef.current = false;
      return;
    }

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75);
    renderer.setPixelRatio(DPR);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    mount.appendChild(canvas);
    setStatus("running");

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffffff, 26, 125);

    const BASE_FOV = isMobile ? 78 : 66;
    const camera = new THREE.PerspectiveCamera(
      BASE_FOV,
      window.innerWidth / window.innerHeight,
      0.1,
      260
    );

    /* ---------- corridor path ---------- */
    const N = SERVICES.length;
    const SPAN = 22;
    const pathPts: THREE.Vector3[] = [];
    for (let i = 0; i <= N + 2; i++) {
      const t = i / (N + 2);
      pathPts.push(
        new THREE.Vector3(
          Math.sin(t * Math.PI * 1.9) * 6.5,
          Math.cos(t * Math.PI * 1.4) * 3.2,
          -i * SPAN
        )
      );
    }
    const path = new THREE.CatmullRomCurve3(pathPts);

    const SAMPLES = 600;
    const samples: THREE.Vector3[] = [];
    for (let i = 0; i <= SAMPLES; i++) samples.push(path.getPointAt(i / SAMPLES));

    function sampleAt(t: number, out: THREE.Vector3) {
      const x = Math.max(0, Math.min(1, t)) * SAMPLES;
      const i = Math.floor(x);
      const f = x - i;
      return out.copy(samples[i]).lerp(samples[Math.min(SAMPLES, i + 1)], f);
    }

    // Frenet frames give each ring a stable basis, so ordered particles sit
    // on a true perpendicular ring rather than a smeared ellipse.
    const FRAMES = 240;
    const frames = path.computeFrenetFrames(FRAMES, false);

    /* ---------- tunnel wall ----------
       A faint wireframe tube. Does almost nothing on its own but supplies
       the parallax that makes forward motion legible on a flat background. */
    const tubeGeo = new THREE.TubeGeometry(path, 200, 9.5, 9, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0x2f5d7c,
      wireframe: true,
      transparent: true,
      opacity: 0.055,
      depthWrite: false,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(tube);

    /* ---------- ring gates ---------- */
    type Gate = {
      ring: THREE.Mesh;
      halo: THREE.Mesh;
      ticks: THREE.LineSegments;
      t: number;
    };
    const gates: Gate[] = [];
    const gateGroup = new THREE.Group();
    scene.add(gateGroup);

    const ringGeo = new THREE.TorusGeometry(4.6, 0.1, 8, 72);
    const haloGeo = new THREE.TorusGeometry(4.6, 0.3, 6, 48);
    const _v = new THREE.Vector3();

    SERVICES.forEach((svc, i) => {
      const t = (i + 1.2) / (N + 2);
      const pos = sampleAt(t, new THREE.Vector3());
      const tangent = path.getTangentAt(Math.min(0.999, t));
      const color = new THREE.Color(svc.tone).lerp(new THREE.Color(0x2f5d7c), 0.18);

      const ring = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4 })
      );
      ring.position.copy(pos);
      ring.lookAt(pos.clone().add(tangent));

      const halo = new THREE.Mesh(
        haloGeo,
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        })
      );
      halo.position.copy(pos);
      halo.quaternion.copy(ring.quaternion);
      halo.scale.setScalar(1.06);

      const tickPts: number[] = [];
      const TICKS = 24;
      for (let k = 0; k < TICKS; k++) {
        const a = (k / TICKS) * Math.PI * 2;
        const inner = k % 6 === 0 ? 4.95 : 4.78;
        const outer = k % 6 === 0 ? 5.6 : 5.15;
        tickPts.push(
          Math.cos(a) * inner, Math.sin(a) * inner, 0,
          Math.cos(a) * outer, Math.sin(a) * outer, 0
        );
      }
      const tickGeo = new THREE.BufferGeometry();
      tickGeo.setAttribute("position", new THREE.Float32BufferAttribute(tickPts, 3));
      const ticks = new THREE.LineSegments(
        tickGeo,
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 })
      );
      ticks.position.copy(pos);
      ticks.quaternion.copy(ring.quaternion);

      gateGroup.add(ring, halo, ticks);
      gates.push({ ring, halo, ticks, t });
    });

    /* ---------- the field: noise → signal ---------- */
    const COUNT = isMobile ? 700 : 1400;
    const aChaos = new Float32Array(COUNT * 3);
    const aOrder = new Float32Array(COUNT * 3);
    const aCenter = new Float32Array(COUNT * 3);
    const aSeed = new Float32Array(COUNT);

    const RINGS = 90;
    for (let i = 0; i < COUNT; i++) {
      const seed = Math.random();
      aSeed[i] = seed;

      // Ordered target: a ring around the axis, snapped to a discrete
      // station so the resolved state reads as structure, not a tube.
      const ringIdx = Math.floor((i / COUNT) * RINGS);
      const t = (ringIdx + 0.5) / RINGS;
      const center = sampleAt(t, _v.clone());
      const fi = Math.min(FRAMES - 1, Math.floor(t * FRAMES));
      const nrm = frames.normals[fi];
      const bnm = frames.binormals[fi];
      const ang = (i % 18) * ((Math.PI * 2) / 18) + ringIdx * 0.22;
      const rad = 6.4 + (seed - 0.5) * 1.1;

      aCenter[i * 3] = center.x;
      aCenter[i * 3 + 1] = center.y;
      aCenter[i * 3 + 2] = center.z;

      aOrder[i * 3] = center.x + (nrm.x * Math.cos(ang) + bnm.x * Math.sin(ang)) * rad;
      aOrder[i * 3 + 1] = center.y + (nrm.y * Math.cos(ang) + bnm.y * Math.sin(ang)) * rad;
      aOrder[i * 3 + 2] = center.z + (nrm.z * Math.cos(ang) + bnm.z * Math.sin(ang)) * rad;

      // Chaotic origin: same corridor, no structure whatsoever.
      const ct = Math.random();
      const cc = sampleAt(ct, _v.clone());
      const ca = Math.random() * Math.PI * 2;
      const cr = 2 + Math.random() * 13;
      aChaos[i * 3] = cc.x + Math.cos(ca) * cr;
      aChaos[i * 3 + 1] = cc.y + Math.sin(ca) * cr;
      aChaos[i * 3 + 2] = cc.z + (Math.random() - 0.5) * 26;
    }

    const fieldGeo = new THREE.BufferGeometry();
    // `position` must exist for frustum/bounds machinery; chaos is the
    // authoritative start, so alias it.
    fieldGeo.setAttribute("position", new THREE.BufferAttribute(aChaos, 3));
    fieldGeo.setAttribute("aOrder", new THREE.BufferAttribute(aOrder, 3));
    fieldGeo.setAttribute("aCenter", new THREE.BufferAttribute(aCenter, 3));
    fieldGeo.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));

    const fieldMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: DPR },
        uResolve: { value: 0 },
        uCollapse: { value: 0 },
        uSpeed: { value: 0 },
      },
      vertexShader: `
        attribute vec3 aOrder;
        attribute vec3 aCenter;
        attribute float aSeed;
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uResolve;
        uniform float uCollapse;
        uniform float uSpeed;
        varying float vResolve;
        varying float vSeed;
        varying float vFog;

        void main() {
          vSeed = aSeed;

          // Staggered crystallisation: each particle locks in at its own
          // point in the scroll, so the field resolves unevenly.
          float r = clamp((uResolve - aSeed * 0.4) / 0.6, 0.0, 1.0);
          r = smoothstep(0.0, 1.0, r);
          vResolve = r;

          vec3 p = mix(position, aOrder, r);

          // Jitter is the visual signature of noise. It damps to nothing
          // as the particle resolves.
          float j = (1.0 - r) * 1.5;
          p.x += sin(uTime * 1.9 + aSeed * 41.0) * j;
          p.y += cos(uTime * 2.3 + aSeed * 27.0) * j;
          p.z += sin(uTime * 1.4 + aSeed * 13.0) * j * 0.7;

          // Resolved particles keep a slow breathing drift so the ordered
          // state is calm, not frozen.
          p.x += sin(uTime * 0.3 + aSeed * 6.28) * 0.3 * r;
          p.y += cos(uTime * 0.25 + aSeed * 6.28) * 0.3 * r;

          // Endgame: the structure collapses onto its own axis.
          p = mix(p, aCenter, uCollapse);

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vFog = clamp((-mv.z - 20.0) / 105.0, 0.0, 1.0);
          gl_Position = projectionMatrix * mv;

          float sz = 1.1 + aSeed * 2.2 + r * 1.1 + uSpeed * 5.0;
          gl_PointSize = sz * uPixelRatio * (14.0 / max(-mv.z, 1.0));
        }
      `,
      fragmentShader: `
        varying float vResolve;
        varying float vSeed;
        varying float vFog;

        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;

          // Dead static grey → brand colour as the signal locks in.
          vec3 noise = vec3(0.62, 0.64, 0.66);
          vec3 slate = vec3(0.184, 0.365, 0.486);
          vec3 sky   = vec3(0.494, 0.784, 0.890);
          vec3 sand  = vec3(0.851, 0.725, 0.541);

          vec3 tuned = mix(slate, sky, smoothstep(0.15, 0.85, vSeed));
          tuned = mix(tuned, sand, step(0.9, vSeed) * 0.85);
          vec3 col = mix(noise, tuned, vResolve);

          float core = 1.0 - smoothstep(0.2, 0.5, d);
          float a = core * (1.0 - vFog) * (0.3 + vResolve * 0.55);
          gl_FragColor = vec4(col, a);
        }
      `,
    });

    const field = new THREE.Points(fieldGeo, fieldMat);
    field.frustumCulled = false;
    scene.add(field);

    /* ---------- scroll driver: polled in-frame ---------- */
    function readProgress(): number {
      if (corridorProgress.live) {
        return Math.max(0, Math.min(1, corridorProgress.value));
      }
      const doc = document.scrollingElement || document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      if (max <= 0) return 0;
      return Math.max(0, Math.min(1, doc.scrollTop / max));
    }

    const scrollRef = { current: readProgress(), prev: readProgress() };
    let speed = 0;

    /* ---------- pointer parallax ---------- */
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    function onMove(e: PointerEvent) {
      ptr.tx = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.ty = -(e.clientY / window.innerHeight) * 2 + 1;
    }
    if (!isMobile) window.addEventListener("pointermove", onMove, { passive: true });

    let resizeTimer = 0;
    function applySize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(applySize, 120);
    }
    window.addEventListener("resize", onResize);

    /* ---------- context loss / restore ---------- */
    let contextLost = false;
    function onContextLost(e: Event) {
      e.preventDefault();
      contextLost = true;
      renderer.setAnimationLoop(null);
    }
    function onContextRestored() {
      contextLost = false;
      fieldMat.uniforms.uPixelRatio.value = DPR;
      fieldMat.needsUpdate = true;
      applySize();
      renderer.setAnimationLoop(tick);
    }
    canvas.addEventListener("webglcontextlost", onContextLost, false);
    canvas.addEventListener("webglcontextrestored", onContextRestored, false);

    function onVisibility() {
      if (contextLost) return;
      if (document.hidden) renderer.setAnimationLoop(null);
      else {
        clock.getDelta();
        renderer.setAnimationLoop(tick);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    /* ---------- loop ---------- */
    const clock = new THREE.Clock();
    const lookTarget = new THREE.Vector3();
    const camPos = new THREE.Vector3();
    let frameCount = 0;

    const REACH = 0.1;
    const PEAK = 0.045;
    const THROUGH = 0.018;

    function tick() {
      const dt = Math.max(0.001, Math.min(0.05, clock.getDelta()));
      const time = clock.getElapsedTime();

      const target = readProgress();
      scrollRef.current += (target - scrollRef.current) * 0.075;
      const s = Math.max(0, Math.min(0.985, scrollRef.current * 0.92));

      // Scroll velocity → acceleration cues. Smoothed hard, because raw
      // per-frame delta is far too spiky to drive optics with.
      const raw = Math.abs(scrollRef.current - scrollRef.prev) / dt;
      speed += (Math.min(1, raw * 1.6) - speed) * 0.12;
      scrollRef.prev = scrollRef.current;

      // Resolve tracks progress slightly ahead of the camera so structure
      // has already formed by the time you arrive in it.
      const resolve = Math.min(1, Math.pow(Math.min(1, s * 1.25), 0.85));
      const collapse = Math.max(0, Math.min(1, (s - 0.82) / 0.16));

      fieldMat.uniforms.uTime.value = time;
      fieldMat.uniforms.uResolve.value = resolve;
      fieldMat.uniforms.uCollapse.value = collapse * collapse;
      fieldMat.uniforms.uSpeed.value = speed;

      tubeMat.opacity = 0.02 + resolve * 0.06;

      ptr.x += (ptr.tx - ptr.x) * 0.05;
      ptr.y += (ptr.ty - ptr.y) * 0.05;

      sampleAt(s, camPos);
      camera.position.set(
        camPos.x + ptr.x * 1.6,
        camPos.y + ptr.y * 1.1,
        camPos.z
      );
      sampleAt(s + 0.035, lookTarget);
      camera.lookAt(lookTarget);
      camera.rotation.z =
        Math.sin(time * 0.12) * 0.03 + ptr.x * 0.04 + speed * 0.05;

      // FOV punch on fast scroll — the cheapest convincing sense of speed.
      const wantFov = BASE_FOV + speed * 11;
      if (Math.abs(camera.fov - wantFov) > 0.01) {
        camera.fov += (wantFov - camera.fov) * 0.15;
        camera.updateProjectionMatrix();
      }

      for (let i = 0; i < gates.length; i++) {
        const g = gates[i];
        const dist = Math.abs(g.t - s);
        const approach = 1 - Math.min(1, Math.max(0, dist - PEAK) / (REACH - PEAK));
        const passing = Math.min(1, Math.max(0, dist - THROUGH) / (PEAK - THROUGH));
        const ignite = approach * (dist < PEAK ? passing : 1);

        (g.ring.material as THREE.MeshBasicMaterial).opacity = 0.1 + ignite * 0.55;
        (g.halo.material as THREE.MeshBasicMaterial).opacity = ignite * ignite * 0.22;
        (g.ticks.material as THREE.LineBasicMaterial).opacity = 0.06 + ignite * 0.4;

        const sc = 1 + ignite * 0.06;
        g.ring.scale.setScalar(sc);
        g.halo.scale.setScalar(sc * 1.06);
        g.ticks.rotation.z = time * (0.12 + ignite * 0.5);
      }

      renderer.render(scene, camera);

      frameCount++;
      if (frameCount % 15 === 0) {
        setDebugLine(
          `${canvas.width}x${canvas.height} p=${target.toFixed(3)} ` +
            `z=${camera.position.z.toFixed(1)} res=${resolve.toFixed(2)} ` +
            `spd=${speed.toFixed(2)} col=${collapse.toFixed(2)}`
        );
      }
    }

    applySize();
    renderer.setAnimationLoop(tick);

    return () => {
      renderer.setAnimationLoop(null);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      if (!isMobile) window.removeEventListener("pointermove", onMove);
      ringGeo.dispose();
      haloGeo.dispose();
      gates.forEach((g) => {
        (g.ring.material as THREE.Material).dispose();
        (g.halo.material as THREE.Material).dispose();
        (g.ticks.material as THREE.Material).dispose();
        g.ticks.geometry.dispose();
      });
      tubeGeo.dispose();
      tubeMat.dispose();
      fieldGeo.dispose();
      fieldMat.dispose();
      renderer.dispose();
      if (canvas.parentNode === mount) mount.removeChild(canvas);
      bootedRef.current = false;
    };
  }, []);

  return (
    <>
      <div
        ref={mountRef}
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          zIndex: 0,
          background:
            "radial-gradient(ellipse 75% 60% at 50% 40%, rgba(126,200,227,0.16) 0%, transparent 68%), #ffffff",
        }}
      />
      {showDebug && (
        <div
          className="fixed bottom-2 left-2 pointer-events-none"
          style={{
            zIndex: 9999,
            background: "rgba(9,18,28,0.9)",
            color: "#7EC8E3",
            font: "11px/1.5 ui-monospace, monospace",
            padding: "6px 9px",
            borderRadius: "6px",
            maxWidth: "94vw",
          }}
        >
          corridor: {status}
          {debugLine ? <><br />{debugLine}</> : null}
        </div>
      )}
    </>
  );
}
