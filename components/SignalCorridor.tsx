"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SERVICES } from "@/lib/services";

/**
 * SignalCorridor — the scroll journey.
 *
 * Mechanism: the CAMERA flies along a CatmullRom spline through persistent
 * 3D geometry — eight ring-gates, one per service channel, plus a volumetric
 * dust field for speed cues. Gates ignite as the camera passes through them.
 *
 * Deliberately NOT a particle-morph: nothing changes shape. The world is
 * fixed; you travel through it. Scroll = distance down the corridor.
 *
 * ── Diagnostics ───────────────────────────────────────────────────────────
 * Every early-return here used to be silent, so a component that never
 * mounted looked identical to one that mounted and rendered nothing. Each
 * bail now records WHY, and appending `?debug=1` to the URL surfaces it as
 * an on-screen badge along with live canvas size and scroll progress.
 * Without the flag the badge never renders.
 */

/**
 * Optional external override. Leave `live` false and the corridor tracks
 * document scroll on its own.
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

    // StrictMode double-mount guard — two loops on one canvas is a freeze.
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
    // Fog pulled back: at 18→78 on a white background the gates washed out
    // to near-invisible before the camera ever reached them.
    scene.fog = new THREE.Fog(0xffffff, 30, 130);

    const camera = new THREE.PerspectiveCamera(
      isMobile ? 78 : 66,
      window.innerWidth / window.innerHeight,
      0.1,
      240
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
    for (let i = 0; i <= SAMPLES; i++) {
      samples.push(path.getPointAt(i / SAMPLES));
    }
    const _tmp = new THREE.Vector3();
    function sampleAt(t: number, out: THREE.Vector3) {
      const x = Math.max(0, Math.min(1, t)) * SAMPLES;
      const i = Math.floor(x);
      const f = x - i;
      const a = samples[i];
      const b = samples[Math.min(SAMPLES, i + 1)];
      return out.copy(a).lerp(b, f);
    }

    /* ---------- ring gates ---------- */
    const gateGroup = new THREE.Group();
    scene.add(gateGroup);

    type Gate = {
      ring: THREE.Mesh;
      halo: THREE.Mesh;
      ticks: THREE.LineSegments;
      t: number;
    };
    const gates: Gate[] = [];

    // Thicker tube — 0.08 was sub-pixel at distance on a white field.
    const ringGeo = new THREE.TorusGeometry(4.6, 0.14, 8, 72);
    const haloGeo = new THREE.TorusGeometry(4.6, 0.34, 6, 48);

    SERVICES.forEach((svc, i) => {
      const t = (i + 1.2) / (N + 2);
      const pos = sampleAt(t, new THREE.Vector3());
      const tangent = path.getTangentAt(Math.min(0.999, t));
      // Darken toward slate so geometry reads against white.
      const color = new THREE.Color(svc.tone).lerp(new THREE.Color(0x2f5d7c), 0.35);

      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.75,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(pos.clone().add(tangent));

      const haloMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
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
      tickGeo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(tickPts, 3)
      );
      const tickMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.5,
      });
      const ticks = new THREE.LineSegments(tickGeo, tickMat);
      ticks.position.copy(pos);
      ticks.quaternion.copy(ring.quaternion);

      gateGroup.add(ring, halo, ticks);
      gates.push({ ring, halo, ticks, t });
    });

    /* ---------- dust field ---------- */
    const DUST = isMobile ? 300 : 800;
    const dustPos = new Float32Array(DUST * 3);
    const dustSeed = new Float32Array(DUST);
    for (let i = 0; i < DUST; i++) {
      const p = sampleAt(Math.random(), _tmp);
      const spread = 9 + Math.random() * 7;
      const a = Math.random() * Math.PI * 2;
      dustPos[i * 3] = p.x + Math.cos(a) * spread;
      dustPos[i * 3 + 1] = p.y + Math.sin(a) * spread;
      dustPos[i * 3 + 2] = p.z + (Math.random() - 0.5) * 8;
      dustSeed[i] = Math.random();
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    dustGeo.setAttribute("aSeed", new THREE.BufferAttribute(dustSeed, 1));

    const dustMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: DPR },
      },
      vertexShader: `
        attribute float aSeed;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vSeed;
        varying float vFog;
        void main() {
          vSeed = aSeed;
          vec3 p = position;
          p.x += sin(uTime * 0.3 + aSeed * 6.28) * 0.5;
          p.y += cos(uTime * 0.25 + aSeed * 6.28) * 0.5;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vFog = clamp((-mv.z - 20.0) / 100.0, 0.0, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (1.8 + aSeed * 3.0) * uPixelRatio * (14.0 / max(-mv.z, 1.0));
        }
      `,
      fragmentShader: `
        varying float vSeed;
        varying float vFog;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          vec3 slate = vec3(0.184, 0.365, 0.486);
          vec3 sky   = vec3(0.494, 0.784, 0.890);
          vec3 sand  = vec3(0.851, 0.725, 0.541);
          vec3 col = mix(slate, sky, smoothstep(0.15, 0.85, vSeed));
          col = mix(col, sand, step(0.9, vSeed) * 0.8);
          float a = (1.0 - smoothstep(0.2, 0.5, d)) * (1.0 - vFog) * (0.5 + vSeed * 0.4);
          gl_FragColor = vec4(col, a);
        }
      `,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    dust.frustumCulled = false;
    scene.add(dust);

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

    const scrollRef = { current: readProgress() };

    /* ---------- pointer parallax ---------- */
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    function onMove(e: PointerEvent) {
      ptr.tx = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.ty = -(e.clientY / window.innerHeight) * 2 + 1;
    }
    if (!isMobile)
      window.addEventListener("pointermove", onMove, { passive: true });

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
      dustMat.uniforms.uPixelRatio.value = DPR;
      dustMat.needsUpdate = true;
      applySize();
      renderer.setAnimationLoop(tick);
    }
    canvas.addEventListener("webglcontextlost", onContextLost, false);
    canvas.addEventListener("webglcontextrestored", onContextRestored, false);

    /* ---------- visibility pause ---------- */
    function onVisibility() {
      if (contextLost) return;
      if (document.hidden) {
        renderer.setAnimationLoop(null);
      } else {
        clock.getDelta();
        renderer.setAnimationLoop(tick);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    /* ---------- loop ---------- */
    const clock = new THREE.Clock();
    const lookTarget = new THREE.Vector3();
    const camPos = new THREE.Vector3();
    let frames = 0;

    function tick() {
      const time = clock.getElapsedTime();
      dustMat.uniforms.uTime.value = time;

      const target = readProgress();
      scrollRef.current += (target - scrollRef.current) * 0.075;
      const s = Math.max(0, Math.min(0.985, scrollRef.current * 0.92));

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
      camera.rotation.z = Math.sin(time * 0.12) * 0.03 + ptr.x * 0.04;

      for (let i = 0; i < gates.length; i++) {
        const g = gates[i];
        const near = 1 - Math.min(1, Math.abs(g.t - s) / 0.085);
        (g.ring.material as THREE.MeshBasicMaterial).opacity = 0.5 + near * 0.5;
        (g.halo.material as THREE.MeshBasicMaterial).opacity = near * near * 0.3;
        (g.ticks.material as THREE.LineBasicMaterial).opacity = 0.3 + near * 0.5;
        const sc = 1 + near * 0.07;
        g.ring.scale.setScalar(sc);
        g.halo.scale.setScalar(sc * 1.06);
        g.ticks.rotation.z = time * (0.12 + near * 0.5);
      }

      renderer.render(scene, camera);

      // Cheap on-screen telemetry, sampled ~4x/sec, only when ?debug=1.
      frames++;
      if (frames % 15 === 0) {
        setDebugLine(
          `${canvas.width}x${canvas.height} dpr${DPR.toFixed(2)} ` +
            `p=${target.toFixed(3)} cam z=${camera.position.z.toFixed(1)} ` +
            `f=${frames}`
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
      dustGeo.dispose();
      dustMat.dispose();
      renderer.dispose();
      if (canvas.parentNode === mount) {
        mount.removeChild(canvas);
      }
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
