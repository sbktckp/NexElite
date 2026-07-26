"use client";

import { useEffect, useRef } from "react";
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
 * Perf: the spline is precomputed into a flat sample array at init, so the
 * render loop is pure array math — no curve reparameterization per frame.
 */
export function SignalCorridor() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const DPR = Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.75);
    renderer.setPixelRatio(DPR);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffffff, 18, 78);

    const camera = new THREE.PerspectiveCamera(
      isMobile ? 78 : 66,
      window.innerWidth / window.innerHeight,
      0.1,
      200
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

    // Precompute the spline once. Render loop then does array lerp only.
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

    const ringGeo = new THREE.TorusGeometry(4.6, 0.08, 8, 72);
    const haloGeo = new THREE.TorusGeometry(4.6, 0.34, 6, 48);

    SERVICES.forEach((svc, i) => {
      const t = (i + 1.2) / (N + 2);
      const pos = sampleAt(t, new THREE.Vector3());
      const tangent = path.getTangentAt(Math.min(0.999, t));
      const color = new THREE.Color(svc.tone);

      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.55,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(pos.clone().add(tangent));

      const haloMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
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
        opacity: 0.3,
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
          vFog = clamp((-mv.z - 12.0) / 60.0, 0.0, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (1.4 + aSeed * 2.6) * uPixelRatio * (14.0 / max(-mv.z, 1.0));
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
          float a = (1.0 - smoothstep(0.2, 0.5, d)) * (1.0 - vFog) * (0.35 + vSeed * 0.4);
          gl_FragColor = vec4(col, a);
        }
      `,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    dust.frustumCulled = false;
    scene.add(dust);

    /* ---------- scroll driver ---------- */
    const scrollRef = { target: 0, current: 0 };
    function onScroll() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      scrollRef.target = max > 0 ? window.scrollY / max : 0;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    scrollRef.current = scrollRef.target;

    /* ---------- pointer parallax ---------- */
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    function onMove(e: PointerEvent) {
      ptr.tx = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.ty = -(e.clientY / window.innerHeight) * 2 + 1;
    }
    if (!isMobile)
      window.addEventListener("pointermove", onMove, { passive: true });

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onResize);

    /* ---------- loop ---------- */
    const clock = new THREE.Clock();
    const lookTarget = new THREE.Vector3();
    const camPos = new THREE.Vector3();
    let raf = 0;

    function tick() {
      const time = clock.getElapsedTime();
      dustMat.uniforms.uTime.value = time;

      scrollRef.current += (scrollRef.target - scrollRef.current) * 0.075;
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
        (g.ring.material as THREE.MeshBasicMaterial).opacity = 0.28 + near * 0.72;
        (g.halo.material as THREE.MeshBasicMaterial).opacity = near * near * 0.4;
        (g.ticks.material as THREE.LineBasicMaterial).opacity = 0.16 + near * 0.6;
        const sc = 1 + near * 0.07;
        g.ring.scale.setScalar(sc);
        g.halo.scale.setScalar(sc * 1.06);
        g.ticks.rotation.z = time * (0.12 + near * 0.5);
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
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
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
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
  );
}
